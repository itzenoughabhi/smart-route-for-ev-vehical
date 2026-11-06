import { Vehicle, VehicleStatus, VehicleModel, Position3D } from '../../types';
import { stationService } from '../stations/station.service';
import { eventService } from '../events/event.service';
import {
  findShortestPath,
  findNearestNodeId,
  findForwardNodeId,
  generateCurvedRouteFromNodeIds,
  generateRandomRoute,
  getStationNodeId,
  getStationHighwayNodeId,
  ROAD_NODES,
} from './road.graph';

export interface RegionalCorridor {
  id: string;
  name: string;
  region: 'boisar' | 'palghar' | 'shirgaon' | 'tarapur' | 'manor' | 'dahanu' | 'midc' | 'betegaon';
  nodes: string[];
}

export const REGIONAL_CORRIDORS: Record<string, RegionalCorridor> = {
  boisar_town: {
    id: 'boisar_town',
    name: 'Boisar Town & Railway Station Corridor',
    region: 'boisar',
    nodes: ['BOISAR_TOWN', 'BOISAR_EAST', 'NORTH_OUTER', 'SUBSTATION_RECONNECT', 'SUBSTATION_NORTH_LINK', 'GRID_S01', 'FEEDER_AVE', 'NAVAPUR_CENTRAL', 'MIDC_BRANCH', 'CENTRAL_ROUNDABOUT', 'BOISAR_TOWN'],
  },
  palghar_sh40: {
    id: 'palghar_sh40',
    name: 'Boisar–Palghar Highway (SH-40)',
    region: 'palghar',
    nodes: ['SARAVALI_JCT', 'SARAVALI_MID', 'D305_JUNCTION', 'BETEGAON_MID', 'UMROLI_JCT', 'PALGHAR_NORTH', 'P401_HIGHWAY', 'SHIRGAON_LINK_3', 'SHIRGAON_LINK_2', 'SHIRGAON_LINK_1', 'SHIRGAON_COAST_HWY', 'SHIRGAON_PT4', 'SHIRGAON_PT3', 'SHIRGAON_PT2', 'UMROLI_JCT', 'BETEGAON_MID', 'D305_JUNCTION', 'SARAVALI_MID', 'SARAVALI_JCT'],
  },
  shirgaon_beach: {
    id: 'shirgaon_beach',
    name: 'Shirgaon Historic Beach & Fort Promenade',
    region: 'shirgaon',
    nodes: ['UMROLI_JCT', 'SHIRGAON_PT2', 'SHIRGAON_PT3', 'SHIRGAON_PT4', 'SHIRGAON_COAST_HWY', 'SHIRGAON_LINK_1', 'SHIRGAON_LINK_2', 'SHIRGAON_LINK_3', 'P401_HIGHWAY', 'PALGHAR_NORTH', 'UMROLI_JCT'],
  },
  tarapur_coast: {
    id: 'tarapur_coast',
    name: 'Tarapur Coastal Highway near Chinchani',
    region: 'tarapur',
    nodes: ['MIDC_BRANCH', 'NAVAPUR_CENTRAL', 'NAVAPUR_B104_HWY', 'NAVAPUR_OUTER', 'CHINCHANI_COAST', 'T601_HIGHWAY', 'CHINCHANI_COAST', 'NAVAPUR_OUTER', 'NAVAPUR_B104_HWY', 'NAVAPUR_CENTRAL', 'MIDC_BRANCH'],
  },
  manor_express: {
    id: 'manor_express',
    name: 'Manor NH-48 Express Highway & Surya River',
    region: 'manor',
    nodes: ['BOISAR_TOWN', 'MANOR_APPROACH_1', 'MANOR_APPROACH_2', 'MANOR_SURYA_RIVER', 'M501_HIGHWAY', 'PALGHAR_MANOR_LINK_2', 'PALGHAR_MANOR_LINK_1', 'P401_HIGHWAY', 'PALGHAR_NORTH', 'UMROLI_JCT', 'BETEGAON_MID', 'D305_JUNCTION', 'SARAVALI_MID', 'SARAVALI_JCT', 'CENTRAL_ROUNDABOUT', 'BOISAR_TOWN'],
  },
  dahanu_arterial: {
    id: 'dahanu_arterial',
    name: 'Dahanu Northern Arterial Highway',
    region: 'dahanu',
    nodes: ['NORTH_OUTER', 'VANGAON_JCT', 'DAHANU_MID', 'D701_HIGHWAY', 'DAHANU_MID', 'VANGAON_JCT', 'NORTH_OUTER'],
  },
  midc_industrial: {
    id: 'midc_industrial',
    name: 'Tarapur MIDC Chemical & Industrial Ring',
    region: 'midc',
    nodes: ['MIDC_BRANCH', 'MIDC_CHEM', 'MIDC_C201_HWY', 'MIDC_HEAVY', 'MIDC_S03', 'MIDC_BORDER', 'SARAVALI_JCT', 'CENTRAL_ROUNDABOUT', 'MIDC_BRANCH'],
  },
  palghar_manor_link: {
    id: 'palghar_manor_link',
    name: 'Palghar–Manor Regional Connector',
    region: 'manor',
    nodes: ['P401_HIGHWAY', 'PALGHAR_MANOR_LINK_1', 'PALGHAR_MANOR_LINK_2', 'M501_HIGHWAY', 'PALGHAR_MANOR_LINK_2', 'PALGHAR_MANOR_LINK_1', 'P401_HIGHWAY'],
  },
  betegaon_suburban: {
    id: 'betegaon_suburban',
    name: 'Saravali & Betegaon Residential Township',
    region: 'betegaon',
    nodes: ['SARAVALI_JCT', 'BETEGAON_HOME_024', 'BETEGAON_SEC', 'BETEGAON_HOME_088', 'BETEGAON_GREEN', 'BOISAR_TOWN', 'CENTRAL_ROUNDABOUT', 'SARAVALI_JCT'],
  },
};

export class VehicleService {
  private static instance: VehicleService;
  private vehicles: Map<string, Vehicle> = new Map();

  private constructor() {
    this.seedVehicles();
  }

  public static getInstance(): VehicleService {
    if (!VehicleService.instance) {
      VehicleService.instance = new VehicleService();
    }
    return VehicleService.instance;
  }

  public reseedVehicles() {
    this.vehicles.clear();
    this.seedVehicles();
  }

  public static getCorridorRoute(corridorId: string): Position3D[] {
    const corridor = REGIONAL_CORRIDORS[corridorId] || REGIONAL_CORRIDORS.boisar_town;
    return generateCurvedRouteFromNodeIds(corridor.nodes);
  }

  public static getNextContinuousRoute(
    currentPos: Position3D,
    currentCorridorId?: string,
    currentHeading?: number
  ): { corridorId: string; corridorName: string; route: Position3D[] } {
    const activeCorridorId = currentCorridorId && REGIONAL_CORRIDORS[currentCorridorId]
      ? currentCorridorId
      : VehicleService.getNearestCorridorId(currentPos);
    
    const activeCorridor = REGIONAL_CORRIDORS[activeCorridorId] || REGIONAL_CORRIDORS.palghar_sh40;
    const corridorNodes = activeCorridor.nodes;

    const hasHeading = currentHeading !== undefined && !isNaN(currentHeading);
    const fX = hasHeading ? Math.sin(currentHeading!) : 0;
    const fZ = hasHeading ? Math.cos(currentHeading!) : 0;

    let bestIdx = 0;
    let bestScore = Infinity;
    let bestTProj = 0;

    // Directional corridor matching: test each candidate segment along activeCorridor
    for (let i = 0; i < corridorNodes.length; i++) {
      const nodeAId = corridorNodes[i];
      const nodeA = ROAD_NODES[nodeAId];
      if (!nodeA) continue;

      const nextNodeId = corridorNodes[(i + 1) % corridorNodes.length];
      const nextNode = ROAD_NODES[nextNodeId];
      if (!nextNode) continue;

      const segDx = nextNode.x - nodeA.x;
      const segDz = nextNode.z - nodeA.z;
      const segLen = Math.hypot(segDx, segDz);
      if (segLen < 0.1) continue;

      const uSegX = segDx / segLen;
      const uSegZ = segDz / segLen;

      // Projection of vehicle currentPos relative to segment nodeA
      const vx = currentPos.x - nodeA.x;
      const vz = currentPos.z - nodeA.z;
      const tProj = vx * uSegX + vz * uSegZ;

      // Closest point on the segment
      const tClamped = Math.max(0, Math.min(segLen, tProj));
      const closeX = nodeA.x + uSegX * tClamped;
      const closeZ = nodeA.z + uSegZ * tClamped;
      const perpDist = Math.hypot(currentPos.x - closeX, currentPos.z - closeZ);

      let dirAlignment = 1.0;
      if (hasHeading) {
        dirAlignment = uSegX * fX + uSegZ * fZ;
      }

      let score = perpDist;
      if (dirAlignment < -0.2) {
        score += 400; // heavily penalize backward corridor flow (e.g. Southbound when going North)
      } else {
        score -= dirAlignment * 30; // reward forward alignment
      }

      // Penalize segments that are far behind or excessively ahead of currentPos
      if (tProj < -15.0) score += 200;
      if (tProj > segLen + 25.0) score += 200;

      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        bestTProj = tProj;
      }
    }

    // Determine upcoming node start index:
    // If vehicle has already passed nodeA along the chosen segment, start with nextNode!
    // Never force the vehicle backwards to visit a node it has already driven past!
    const startNodeIdx = bestTProj >= 1.5
      ? (bestIdx + 1) % corridorNodes.length
      : bestIdx;

    const sequence: string[] = [];
    for (let i = 0; i < corridorNodes.length; i++) {
      sequence.push(corridorNodes[(startNodeIdx + i) % corridorNodes.length]);
    }
    sequence.push(corridorNodes[startNodeIdx]);

    // Clean duplicate consecutive nodes
    const cleanSeq: string[] = [];
    for (const n of sequence) {
      if (cleanSeq.length === 0 || cleanSeq[cleanSeq.length - 1] !== n) {
        cleanSeq.push(n);
      }
    }

    const curved = generateCurvedRouteFromNodeIds(cleanSeq, currentPos);
    const targetNode = ROAD_NODES[corridorNodes[startNodeIdx]];
    const targetPos: Position3D = targetNode ? { x: targetNode.x, y: 0.1, z: targetNode.z } : currentPos;
    const finalRoute = curved.length > 2 ? curved : [currentPos, targetPos];

    return {
      corridorId: activeCorridorId,
      corridorName: activeCorridor.name,
      route: finalRoute,
    };
  }

  public static getNearestCorridorId(pos: Position3D): string {
    const nearestNode = findNearestNodeId(pos);
    for (const [id, corridor] of Object.entries(REGIONAL_CORRIDORS)) {
      if (corridor.nodes.includes(nearestNode)) {
        return id;
      }
    }
    return 'palghar_sh40';
  }

  public static getRouteForStation(stationCode: string, fromPos?: Position3D, currentHeading?: number): Position3D[] {
    const endNodeId = getStationNodeId(stationCode);
    let startNodeId = 'CENTRAL_ROUNDABOUT';
    if (fromPos) {
      startNodeId = findForwardNodeId(fromPos, currentHeading);
    } else {
      switch (stationCode) {
        case 'A102': startNodeId = 'BOISAR_EAST'; break;
        case 'B104': startNodeId = 'NAVAPUR_B104_HWY'; break;
        case 'C201': startNodeId = 'MIDC_C201_HWY'; break;
        case 'D305': startNodeId = 'D305_JUNCTION'; break;
        case 'P401': startNodeId = 'P401_HIGHWAY'; break;
        case 'M501': startNodeId = 'M501_HIGHWAY'; break;
        case 'T601': startNodeId = 'T601_HIGHWAY'; break;
        case 'D701': startNodeId = 'D701_HIGHWAY'; break;
        case 'S801': startNodeId = 'SHIRGAON_COAST_HWY'; break;
        default: startNodeId = 'CENTRAL_ROUNDABOUT'; break;
      }
    }
    const path = findShortestPath(startNodeId, endNodeId);
    return generateCurvedRouteFromNodeIds(path, fromPos);
  }

  public static getRouteForServiceCenter(fromPos?: Position3D, currentHeading?: number): Position3D[] {
    const endNodeId = 'S03_WORKSHOP_BAYS';
    const startNodeId = fromPos ? findForwardNodeId(fromPos, currentHeading) : 'CENTRAL_ROUNDABOUT';
    const path = findShortestPath(startNodeId, endNodeId);
    return generateCurvedRouteFromNodeIds(path, fromPos);
  }

  public static getRouteFromCurrentPositionTo(fromPos: Position3D, toPos: Position3D, currentHeading?: number): Position3D[] {
    const startNodeId = findForwardNodeId(fromPos, currentHeading);
    const endNodeId = findNearestNodeId(toPos, false);
    const path = findShortestPath(startNodeId, endNodeId);
    return generateCurvedRouteFromNodeIds(path, fromPos, toPos);
  }

  public static getRandomRoute(fromPos: Position3D, currentHeading?: number, excludeDestination?: string): Position3D[] {
    return generateRandomRoute(fromPos, currentHeading, excludeDestination);
  }

  public static getDepartureRouteForCorridor(
    stationCode: string,
    corridorId: string,
    vehiclePos: Position3D,
    preferredHeading?: number
  ): Position3D[] {
    const bayId = getStationNodeId(stationCode);
    const entranceId = ROAD_NODES[bayId]?.neighbors[0] || 'A102_ENTRANCE';
    const highwayNodeId = getStationHighwayNodeId(stationCode);

    const corridor = REGIONAL_CORRIDORS[corridorId] || REGIONAL_CORRIDORS.boisar_town;
    const corridorNodes = corridor.nodes;

    // Find ALL occurrences of highwayNodeId in corridorNodes (e.g. D305_JUNCTION appears in both directions)
    const matchingIndices: number[] = [];
    for (let i = 0; i < corridorNodes.length; i++) {
      if (corridorNodes[i] === highwayNodeId) {
        matchingIndices.push(i);
      }
    }

    let resumeNodeIndex = -1;

    if (matchingIndices.length > 0) {
      if (matchingIndices.length === 1 || preferredHeading === undefined || isNaN(preferredHeading)) {
        resumeNodeIndex = matchingIndices[0];
      } else {
        // Directional corridor matching: choose the occurrence whose outgoing segment aligns with preferredHeading
        const fX = Math.sin(preferredHeading);
        const fZ = Math.cos(preferredHeading);
        let bestAlign = -Infinity;
        let bestMatch = matchingIndices[0];

        const hwNode = ROAD_NODES[highwayNodeId];
        for (const idx of matchingIndices) {
          const nextNode = ROAD_NODES[corridorNodes[(idx + 1) % corridorNodes.length]];
          if (hwNode && nextNode) {
            const dx = nextNode.x - hwNode.x;
            const dz = nextNode.z - hwNode.z;
            const len = Math.hypot(dx, dz);
            if (len > 0.1) {
              const align = (dx * fX + dz * fZ) / len;
              if (align > bestAlign) {
                bestAlign = align;
                bestMatch = idx;
              }
            }
          }
        }
        resumeNodeIndex = bestMatch;
      }
    }

    const sequence: string[] = [bayId, entranceId, highwayNodeId];

    if (resumeNodeIndex !== -1) {
      for (let i = 1; i <= corridorNodes.length; i++) {
        const nextNode = corridorNodes[(resumeNodeIndex + i) % corridorNodes.length];
        sequence.push(nextNode);
      }
    } else {
      let closestCorridorNode = corridorNodes[0];
      let minD = Infinity;
      const hwNode = ROAD_NODES[highwayNodeId];
      for (const cNodeId of corridorNodes) {
        const cNode = ROAD_NODES[cNodeId];
        if (cNode && hwNode) {
          const d = (cNode.x - hwNode.x) ** 2 + (cNode.z - hwNode.z) ** 2;
          if (d < minD) {
            minD = d;
            closestCorridorNode = cNodeId;
          }
        }
      }
      const transitionPath = findShortestPath(highwayNodeId, closestCorridorNode);
      for (const n of transitionPath.slice(1)) {
        sequence.push(n);
      }

      // Check all occurrences of closestCorridorNode with directional matching
      const cIndices: number[] = [];
      for (let i = 0; i < corridorNodes.length; i++) {
        if (corridorNodes[i] === closestCorridorNode) cIndices.push(i);
      }
      let cIdx = cIndices[0] ?? -1;
      if (cIndices.length > 1 && preferredHeading !== undefined && !isNaN(preferredHeading)) {
        const fX = Math.sin(preferredHeading);
        const fZ = Math.cos(preferredHeading);
        let bestAlign = -Infinity;
        const cNode = ROAD_NODES[closestCorridorNode];
        for (const idx of cIndices) {
          const nextNode = ROAD_NODES[corridorNodes[(idx + 1) % corridorNodes.length]];
          if (cNode && nextNode) {
            const dx = nextNode.x - cNode.x;
            const dz = nextNode.z - cNode.z;
            const len = Math.hypot(dx, dz);
            if (len > 0.1) {
              const align = (dx * fX + dz * fZ) / len;
              if (align > bestAlign) {
                bestAlign = align;
                cIdx = idx;
              }
            }
          }
        }
      }

      if (cIdx !== -1) {
        for (let i = 1; i <= corridorNodes.length; i++) {
          sequence.push(corridorNodes[(cIdx + i) % corridorNodes.length]);
        }
      }
    }

    return generateCurvedRouteFromNodeIds(sequence, vehiclePos);
  }

  public static getDepartureRoute(stationPosition: Position3D, vehiclePosition?: Position3D): Position3D[] {
    const nearestNode = findNearestNodeId(stationPosition, false);
    const corridorId = this.getNearestCorridorId(stationPosition);
    return generateCurvedRouteFromNodeIds([nearestNode], vehiclePosition || stationPosition);
  }

  private seedVehicles() {
    const stations = stationService.getAllStations();

    const corridorFleetSpecs: {
      corridorId: string;
      vehicles: Array<{
        code: string;
        model: VehicleModel;
        battery: number;
        target: number;
        speed: number;
        progressFraction: number;
        stIndex: number;
      }>;
    }[] = [
      {
        corridorId: 'boisar_town',
        vehicles: [
          { code: 'EV-057', model: 'Tata Tiago EV', battery: 68, target: 90, speed: 38, progressFraction: 0.05, stIndex: 0 },
          { code: 'EV-058', model: 'CyberSedan', battery: 84, target: 90, speed: 42, progressFraction: 0.32, stIndex: 0 },
          { code: 'EV-059', model: 'Electric City Bus', battery: 72, target: 95, speed: 32, progressFraction: 0.60, stIndex: 0 },
          { code: 'EV-060', model: 'Apex SUV', battery: 90, target: 95, speed: 44, progressFraction: 0.85, stIndex: 0 },
        ],
      },
      {
        corridorId: 'palghar_sh40',
        vehicles: [
          { code: 'EV-024', model: 'Tata Nexon EV', battery: 78, target: 85, speed: 44, progressFraction: 0.08, stIndex: 3 },
          { code: 'EV-PATROL-03', model: 'Highway Patrol EV', battery: 88, target: 95, speed: 48, progressFraction: 0.35, stIndex: 4 },
          { code: 'EV-025', model: 'Hyundai Ioniq 5', battery: 64, target: 80, speed: 42, progressFraction: 0.62, stIndex: 3 },
          { code: 'EV-026', model: 'Mercedes EQS', battery: 82, target: 90, speed: 46, progressFraction: 0.88, stIndex: 4 },
        ],
      },
      {
        corridorId: 'shirgaon_beach',
        vehicles: [
          { code: 'EV-SHR-01', model: 'Porsche Taycan', battery: 75, target: 85, speed: 48, progressFraction: 0.06, stIndex: 4 },
          { code: 'EV-SHR-02', model: 'BYD Atto 3', battery: 82, target: 90, speed: 42, progressFraction: 0.36, stIndex: 4 },
          { code: 'EV-SHR-03', model: 'Tata Nexon EV', battery: 60, target: 85, speed: 38, progressFraction: 0.66, stIndex: 4 },
          { code: 'EV-SHR-04', model: 'Lucid Air EV', battery: 92, target: 95, speed: 45, progressFraction: 0.90, stIndex: 4 },
        ],
      },
      {
        corridorId: 'tarapur_coast',
        vehicles: [
          { code: 'EV-031', model: 'Mahindra XUV400', battery: 70, target: 80, speed: 40, progressFraction: 0.08, stIndex: 1 },
          { code: 'EV-168', model: 'BYD Atto 3', battery: 85, target: 90, speed: 44, progressFraction: 0.36, stIndex: 6 },
          { code: 'EV-MDY-04', model: 'Tesla Model Y', battery: 76, target: 90, speed: 46, progressFraction: 0.65, stIndex: 6 },
          { code: 'EV-169', model: 'Kia EV6', battery: 90, target: 95, speed: 45, progressFraction: 0.88, stIndex: 6 },
        ],
      },
      {
        corridorId: 'manor_express',
        vehicles: [
          { code: 'EV-142', model: 'Commercial EV Van', battery: 66, target: 90, speed: 45, progressFraction: 0.06, stIndex: 5 },
          { code: 'EV-TRK-01', model: 'Heavy Electric Hauler', battery: 80, target: 90, speed: 36, progressFraction: 0.34, stIndex: 5 },
          { code: 'EV-144', model: 'Electric Pickup Truck', battery: 74, target: 85, speed: 42, progressFraction: 0.64, stIndex: 5 },
          { code: 'EV-145', model: 'Tesla Model Y', battery: 88, target: 95, speed: 48, progressFraction: 0.88, stIndex: 5 },
        ],
      },
      {
        corridorId: 'dahanu_arterial',
        vehicles: [
          { code: 'EV-195', model: 'Kia EV6', battery: 84, target: 95, speed: 48, progressFraction: 0.08, stIndex: 7 },
          { code: 'EV-196', model: 'Hyundai Ioniq 5', battery: 72, target: 85, speed: 44, progressFraction: 0.38, stIndex: 7 },
          { code: 'EV-197', model: 'Tata Nexon EV', battery: 65, target: 85, speed: 40, progressFraction: 0.68, stIndex: 7 },
          { code: 'EV-198', model: 'Heavy Electric Hauler', battery: 79, target: 90, speed: 36, progressFraction: 0.92, stIndex: 7 },
        ],
      },
      {
        corridorId: 'midc_industrial',
        vehicles: [
          { code: 'EV-042', model: 'MG ZS EV', battery: 68, target: 85, speed: 38, progressFraction: 0.05, stIndex: 2 },
          { code: 'EV-PKP-02', model: 'Electric Pickup Truck', battery: 76, target: 85, speed: 40, progressFraction: 0.34, stIndex: 2 },
          { code: 'EV-044', model: 'Commercial EV Van', battery: 58, target: 80, speed: 36, progressFraction: 0.65, stIndex: 2 },
          { code: 'EV-045', model: 'Tata Tiago EV', battery: 80, target: 90, speed: 36, progressFraction: 0.88, stIndex: 2 },
        ],
      },
      {
        corridorId: 'palghar_manor_link',
        vehicles: [
          { code: 'EV-PLG-01', model: 'Highway Patrol EV', battery: 85, target: 95, speed: 48, progressFraction: 0.15, stIndex: 4 },
          { code: 'EV-PLG-02', model: 'Mercedes EQS', battery: 78, target: 90, speed: 46, progressFraction: 0.50, stIndex: 5 },
          { code: 'EV-PLG-03', model: 'Porsche Taycan', battery: 90, target: 95, speed: 50, progressFraction: 0.82, stIndex: 4 },
        ],
      },
      {
        corridorId: 'betegaon_suburban',
        vehicles: [
          { code: 'EV-RES-01', model: 'Tata Nexon EV', battery: 62, target: 85, speed: 36, progressFraction: 0.12, stIndex: 3 },
          { code: 'EV-RES-02', model: 'Mahindra XUV400', battery: 70, target: 85, speed: 38, progressFraction: 0.45, stIndex: 3 },
          { code: 'EV-RES-03', model: 'Tata Tiago EV', battery: 75, target: 90, speed: 35, progressFraction: 0.78, stIndex: 0 },
        ],
      },
    ];

    for (const group of corridorFleetSpecs) {
      const corridor = REGIONAL_CORRIDORS[group.corridorId];
      const route = VehicleService.getCorridorRoute(group.corridorId);
      if (route.length === 0) continue;

      for (const vData of group.vehicles) {
        const station = stations[vData.stIndex] || stations[0];
        const wpIndex = Math.min(
          route.length - 2,
          Math.max(0, Math.floor(route.length * vData.progressFraction))
        );
        const startPos = { ...route[wpIndex] };
        const nextPos = route[wpIndex + 1] || route[0];
        const heading = Math.atan2(nextPos.x - startPos.x, nextPos.z - startPos.z);

        const actualRoute = route;
        const actualWpIndex = wpIndex;
        const targetNodeId = corridor.nodes[corridor.nodes.length - 1];
        const targetName = ROAD_NODES[targetNodeId]?.name || corridor.name;

        const vehicle: Vehicle = {
          id: `veh-${vData.code.toLowerCase()}`,
          code: vData.code,
          model: vData.model,
          batteryCapacityKwh: vData.model === 'Commercial EV Van' || vData.model === 'Heavy Electric Hauler' ? 80 : 50,
          currentBatteryPct: vData.battery,
          targetBatteryPct: vData.target,
          estimatedRangeKm: Math.round((vData.battery / 100) * 380),
          status: 'EN_ROUTE',
          speed: Math.floor(36 + Math.random() * 10),
          position: startPos,
          heading,
          destinationStationId: null,
          assignedChargerId: null,
          currentStationId: null,
          currentLocationName: `Patrolling towards ${targetName}`,
          etaMinutes: 4,
          routeProgress: vData.progressFraction,
          routeWaypoints: actualRoute,
          currentWaypointIndex: actualWpIndex,
          chargingRateKw: 0,
          energyConsumedKwh: 14.2,
          tripDistanceKm: 22.5,
          motorTemperatureC: 58 + Math.floor(Math.random() * 8),
          batteryTemperatureC: 31 + Math.floor(Math.random() * 3),
          brakeSystemHealth: 'NORMAL',
          tyreHealth: 'NORMAL',
          vehicleHealth: 'GOOD',
          faultReason: null,
          serviceCenterId: null,
          repairProgressPct: 0,
          updatedAt: new Date().toISOString(),
        };

        (vehicle as any)._corridorId = group.corridorId;
        this.vehicles.set(vehicle.id, vehicle);
      }
    }

    const approachingVehicles = [
      { code: 'EV-088', model: 'Hyundai Ioniq 5' as VehicleModel, stationIdx: 4, battery: 28 },
      { code: 'EV-CHG-A1', model: 'CyberSedan' as VehicleModel, stationIdx: 0, battery: 24 },
    ];

    for (const app of approachingVehicles) {
      const station = stations[app.stationIdx];
      if (!station) continue;
      const approachRoute = VehicleService.getRouteForStation(station.code);
      if (approachRoute.length === 0) continue;
      const startIdx = Math.max(0, approachRoute.length - 3);
      const startPos = { ...approachRoute[startIdx] };
      const nextPos = approachRoute[startIdx + 1] || startPos;
      const heading = Math.atan2(nextPos.x - startPos.x, nextPos.z - startPos.z);

      const appVehicle: Vehicle = {
        id: `veh-${app.code.toLowerCase()}`,
        code: app.code,
        model: app.model,
        batteryCapacityKwh: 55,
        currentBatteryPct: app.battery,
        targetBatteryPct: 85,
        estimatedRangeKm: Math.round((app.battery / 100) * 380),
        status: 'EN_ROUTE',
        speed: 36,
        position: startPos,
        heading,
        destinationStationId: station.id,
        assignedChargerId: null,
        currentStationId: null,
        currentLocationName: `Approaching ${station.name} (${station.code}) for recharge`,
        etaMinutes: 1,
        routeProgress: 0.8,
        routeWaypoints: approachRoute,
        currentWaypointIndex: startIdx,
        chargingRateKw: 0,
        energyConsumedKwh: 12.4,
        tripDistanceKm: 28.0,
        motorTemperatureC: 56,
        batteryTemperatureC: 31,
        brakeSystemHealth: 'NORMAL',
        tyreHealth: 'NORMAL',
        vehicleHealth: 'GOOD',
        faultReason: null,
        serviceCenterId: null,
        repairProgressPct: 0,
        updatedAt: new Date().toISOString(),
      };

      (appVehicle as any)._corridorId = app.code === 'EV-088' ? 'palghar_sh40' : 'boisar_town';
      this.vehicles.set(appVehicle.id, appVehicle);
    }
  }

  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.get(id) || Array.from(this.vehicles.values()).find(v => v.code.toLowerCase() === id.toLowerCase());
  }

  public spawnVehicle(customData?: Partial<Vehicle>): Vehicle {
    const code = `EV-0${Math.floor(60 + Math.random() * 39)}`;
    const models: VehicleModel[] = [
      'Tata Nexon EV', 'Mahindra XUV400', 'MG ZS EV', 'Tata Tiago EV', 'Hyundai Ioniq 5', 'Commercial EV Van'
    ];
    const corridorKeys = Object.keys(REGIONAL_CORRIDORS);
    const corridorKey = corridorKeys[Math.floor(Math.random() * corridorKeys.length)];
    const corridor = REGIONAL_CORRIDORS[corridorKey];
    const route = VehicleService.getCorridorRoute(corridorKey);
    const startIdx = Math.floor(Math.random() * Math.max(1, route.length - 2));

    const vehicle: Vehicle = {
      id: `veh-${code.toLowerCase()}-${Date.now()}`,
      code,
      model: models[Math.floor(Math.random() * models.length)],
      batteryCapacityKwh: 50,
      currentBatteryPct: Math.floor(40 + Math.random() * 45),
      targetBatteryPct: 85,
      estimatedRangeKm: Math.floor(150 + Math.random() * 100),
      status: 'EN_ROUTE',
      speed: 38 + Math.floor(Math.random() * 12),
      position: { ...route[startIdx] },
      heading: route.length > 1 ? Math.atan2(route[startIdx + 1].x - route[startIdx].x, route[startIdx + 1].z - route[startIdx].z) : 0,
      destinationStationId: null,
      assignedChargerId: null,
      currentStationId: null,
      currentLocationName: `${corridor.name} (Patrol)`,
      etaMinutes: 5,
      routeProgress: startIdx / route.length,
      routeWaypoints: route,
      currentWaypointIndex: startIdx,
      chargingRateKw: 0,
      energyConsumedKwh: 0,
      tripDistanceKm: 4.2,
      motorTemperatureC: 60 + Math.floor(Math.random() * 6),
      batteryTemperatureC: 30 + Math.floor(Math.random() * 4),
      brakeSystemHealth: 'NORMAL',
      tyreHealth: 'NORMAL',
      vehicleHealth: 'GOOD',
      faultReason: null,
      serviceCenterId: null,
      repairProgressPct: 0,
      updatedAt: new Date().toISOString(),
      ...customData,
    };

    this.vehicles.set(vehicle.id, vehicle);

    eventService.addEvent({
      type: 'ARRIVAL',
      severity: 'INFO',
      message: `🚗 ${vehicle.code} (${vehicle.model}) deployed to ${corridor.name} — Battery: ${vehicle.currentBatteryPct}%`,
      vehicleId: vehicle.id,
    });

    return vehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | undefined {
    const vehicle = this.getVehicleById(id);
    if (!vehicle) return undefined;

    Object.assign(vehicle, updates, { updatedAt: new Date().toISOString() });
    return vehicle;
  }

  public redirectVehicle(vehicleId: string, targetStationId: string, customWaypoints?: Position3D[]): boolean {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return false;

    const newStation = stationService.getStationById(targetStationId);
    if (!newStation) return false;

    stationService.releaseChargerByVehicle(vehicle.id);
    stationService.releaseServiceBay(vehicle.id);

    const newRoute = customWaypoints && customWaypoints.length > 1
      ? customWaypoints
      : VehicleService.getRouteFromCurrentPositionTo(vehicle.position, newStation.position, vehicle.heading);

    vehicle.destinationStationId = newStation.id;
    vehicle.serviceCenterId = null;
    vehicle.assignedChargerId = null;
    vehicle.currentStationId = null;
    vehicle.routeWaypoints = newRoute;
    vehicle.currentWaypointIndex = 0;
    vehicle.routeProgress = 0.05;
    vehicle.status = 'EN_ROUTE';
    vehicle.trafficState = 'CRUISING';
    vehicle.speed = 42;
    vehicle.etaMinutes = 4;
    vehicle.currentLocationName = `En route to ${newStation.name} [${newStation.code}]`;
    vehicle.updatedAt = new Date().toISOString();

    eventService.addEvent({
      type: 'REDIRECT',
      severity: 'SUCCESS',
      message: `🔄 ${vehicle.code} routed to Station ${newStation.code} (${newStation.name}) via Margdarshak Route Guidance`,
      vehicleId: vehicle.id,
      stationId: newStation.id,
    });

    return true;
  }

  public sendToService(vehicleId: string): boolean {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return false;

    const sc = stationService.getServiceCenter();
    const serviceRoute = VehicleService.getRouteFromCurrentPositionTo(vehicle.position, sc.position, vehicle.heading);

    stationService.releaseChargerByVehicle(vehicle.id);

    vehicle.status = 'EN_ROUTE';
    vehicle.trafficState = 'SERVICE_ROUTE';
    vehicle.speed = 38;
    vehicle.serviceCenterId = sc.id;
    vehicle.destinationStationId = null;
    vehicle.assignedChargerId = null;
    vehicle.currentStationId = null;
    vehicle.faultReason = vehicle.faultReason || 'BATTERY_THERMAL_ALERT';
    vehicle.routeWaypoints = serviceRoute;
    vehicle.currentWaypointIndex = 0;
    vehicle.routeProgress = 0.05;
    vehicle.etaMinutes = 3;
    vehicle.currentLocationName = `Routing to ${sc.name}`;
    vehicle.updatedAt = new Date().toISOString();

    eventService.addEvent({
      type: 'SERVICE',
      severity: 'WARNING',
      message: `🚨 ${vehicle.code} dispatched to ${sc.name} [S03] for emergency diagnostics`,
      vehicleId: vehicle.id,
    });

    return true;
  }
}

export const vehicleService = VehicleService.getInstance();
