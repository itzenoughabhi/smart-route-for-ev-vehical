'use client';

import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, useGLTF, Clone, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Vehicle } from '../../types';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';

import { ARNavigationRibbon } from './ARNavigationRibbon';

interface ModelSpec {
  path: string;
  scale: number;
  rotY: number;
  groundY: number;
}

const MODEL_SPECS: Record<string, ModelSpec> = {
  'Heavy Electric Hauler': { path: '/models/vehicles/truck.glb', scale: 0.65, rotY: 0, groundY: 0.04 },
  'Electric Truck':        { path: '/models/vehicles/truck.glb', scale: 0.65, rotY: 0, groundY: 0.04 },

  'Electric Pickup Truck': { path: '/models/vehicles/pickup_truck.glb', scale: 0.85, rotY: 0, groundY: 0.02 },
  'Pickup EV':             { path: '/models/vehicles/pickup_truck.glb', scale: 0.85, rotY: 0, groundY: 0.02 },

  'Commercial EV Van':     { path: '/models/vehicles/van.glb', scale: 0.048, rotY: 0, groundY: 0 },
  'FleetVan':              { path: '/models/vehicles/van.glb', scale: 0.048, rotY: 0, groundY: 0 },

  'Electric City Bus':     { path: '/models/vehicles/bus.glb', scale: 0.058, rotY: 0, groundY: 0.04 },

  'Tesla Model Y':         { path: '/models/vehicles/model_y.glb', scale: 1.25, rotY: Math.PI / 2, groundY: 0.02 },

  'Porsche Taycan':        { path: '/models/vehicles/taycan.glb', scale: 88.5, rotY: 0, groundY: 0.02 },

  'Mercedes EQS':          { path: '/models/vehicles/mercedes_benz_vision_eqs.glb', scale: 0.72, rotY: 0, groundY: 0.02 },

  'Lucid Air EV':          { path: '/models/vehicles/lucid.glb', scale: 0.84, rotY: 0, groundY: 0.02 },

  'Highway Patrol EV':     { path: '/models/vehicles/police_car.glb', scale: 1.02, rotY: 0, groundY: 0.02 },

  'Tata Nexon EV':         { path: '/models/vehicles/suv.glb', scale: 0.85, rotY: 0, groundY: 0.02 },
  'Apex SUV':              { path: '/models/vehicles/suv.glb', scale: 0.85, rotY: 0, groundY: 0.02 },
  'BYD Atto 3':            { path: '/models/vehicles/suv.glb', scale: 0.85, rotY: 0, groundY: 0.02 },

  'Mahindra XUV400':       { path: '/models/vehicles/car_sedan.glb', scale: 1.05, rotY: 0, groundY: 0.03 },

  'MG ZS EV':              { path: '/models/vehicles/car_model.glb', scale: 0.0075, rotY: 0, groundY: 0 },

  'Tata Tiago EV':         { path: '/models/vehicles/car.glb', scale: 0.038, rotY: 0, groundY: 0 },

  'Hyundai Ioniq 5':       { path: '/models/vehicles/sports_car.glb', scale: 0.92, rotY: 0, groundY: 0.02 },
  'HyperCoupe':            { path: '/models/vehicles/sports_car.glb', scale: 0.92, rotY: 0, groundY: 0.02 },
  'Kia EV6':               { path: '/models/vehicles/sports_car.glb', scale: 0.92, rotY: 0, groundY: 0.02 },

  'CyberSedan':            { path: '/models/vehicles/cybertruck.glb', scale: 1.25, rotY: Math.PI / 2, groundY: 0.01 },
};

const VehicleGLBModel = React.memo(function VehicleGLBModel({ model }: { model: string }) {
  const spec = MODEL_SPECS[model] || MODEL_SPECS['Tata Nexon EV'];
  const { scene } = useGLTF(spec.path);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        if (child.geometry && !child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        const name = child.name?.toLowerCase() || '';
        if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.25;
            child.material.depthWrite = false;
          }
        }
      }
    });
  }, [scene]);

  return (
    <group position={[0, spec.groundY, 0]} rotation={[0, spec.rotY, 0]}>
      <Clone
        object={scene}
        scale={[spec.scale, spec.scale, spec.scale]}
        castShadow
        receiveShadow
      />
    </group>
  );
});

const FallbackProceduralCar = React.memo(function FallbackProceduralCar({ isSelected, hasFault }: { isSelected: boolean; hasFault: boolean }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.58, 3.5]} />
        <meshStandardMaterial
          color={hasFault ? '#dc2626' : isSelected ? '#2563eb' : '#38bdf8'}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.85, -0.1]} castShadow>
        <boxGeometry args={[1.4, 0.48, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.42, 1.76]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[-0.55, 0.42, 1.76]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[0.55, 0.42, -1.76]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.55, 0.42, -1.76]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {[-0.86, 0.86].map((wx, wi) =>
        [-1.05, 1.05].map((wz, zi) => (
          <mesh key={`w-${wi}-${zi}`} position={[wx, 0.25, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
});

const SelectedVehicleBadge = React.memo(function SelectedVehicleBadge({ vehicleId }: { vehicleId: string }) {
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const liveVehicle = useDigitalTwinStore((s) => Array.isArray(s.vehicles) ? s.vehicles.find((v) => v.id === vehicleId) : null);
  if (!liveVehicle) return null;

  const hasFault = liveVehicle.status === 'FAULT' || liveVehicle.status === 'SERVICE_REQUIRED' || liveVehicle.vehicleHealth === 'CRITICAL';
  const isUnderRepair = liveVehicle.status === 'UNDER_REPAIR';
  const isCharging = liveVehicle.status === 'CHARGING';
  const isQueue = liveVehicle.status === 'QUEUE';

  const batteryPct = Math.round(liveVehicle.currentBatteryPct);
  const isStranded = liveVehicle.status === 'STRANDED' || batteryPct <= 0;
  const isBeingTowed = liveVehicle.status === 'BEING_TOWED' || liveVehicle.trafficState === 'BEING_TOWED';
  const isTowing = liveVehicle.trafficState === 'TOWING';
  const isOvertaking = liveVehicle.trafficState === 'OVERTAKING';
  const isLowBattery = batteryPct <= 20;
  const isCriticalBattery = batteryPct <= 10;

  const getStatusIcon = () => {
    if (isStranded) return '🛑';
    if (isBeingTowed || isTowing) return '🛻';
    if (isOvertaking) return '🏎️';
    if (hasFault) return '🚨';
    if (isUnderRepair) return '🔧';
    if (isCharging) return '⚡';
    if (isQueue) return '⏳';
    if (isCriticalBattery || isLowBattery) return '⚠️';
    if (liveVehicle.status === 'ENTERING_STATION' || liveVehicle.status === 'REVERSE_PARKING') return '🅿️';
    return '🚗';
  };

  return (
    <Html position={[0, 1.85, 0]} center distanceFactor={26} zIndexRange={[100, 0]}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          selectVehicle(vehicleId);
        }}
        className={`cursor-pointer px-2.5 py-0.5 rounded-full border transition-all select-none text-[10px] font-medium flex items-center gap-1 shadow-md ${
          isStranded
            ? 'bg-red-700 text-white border-red-500 shadow-md ring-2 ring-red-400 animate-pulse'
            : isBeingTowed || isTowing
            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300 animate-pulse'
            : isOvertaking
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-yellow-300 shadow-lg shadow-orange-500/40 ring-2 ring-yellow-300 animate-pulse font-bold'
            : hasFault || isCriticalBattery
            ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-300 animate-pulse'
            : isUnderRepair || isLowBattery
            ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-300'
            : 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-300'
        }`}
        style={{ whiteSpace: 'nowrap' }}
      >
        <span>{getStatusIcon()}</span>
        <span className="font-semibold">
          {liveVehicle.code}
          {isStranded ? ' (0% STRANDED)' : isBeingTowed ? ' (TOWED)' : isTowing ? ' (TOW TRUCK)' : isOvertaking ? ' (OVERTAKING)' : ''}
        </span>
        <span className={`text-[9px] font-mono ${
          isStranded || isCriticalBattery 
            ? 'text-yellow-200 font-bold animate-pulse' 
            : isLowBattery 
            ? 'text-amber-100 font-bold' 
            : 'text-emerald-400'
        }`}>
          {batteryPct}%
        </span>
      </div>
    </Html>
  );
});

const VehicleItem = React.memo(function VehicleItem({ 
  vehicle,
  inCabinVehicleId,
}: { 
  vehicle: Vehicle;
  inCabinVehicleId?: string;
}) {
  const isInCabinThisVehicle = inCabinVehicleId === vehicle.id;
  const selectVehicle = useDigitalTwinStore((s) => s.selectVehicle);
  const selectedObject = useDigitalTwinStore((s) => s.selectedObject);
  const isSelected = selectedObject?.type === 'vehicle' && selectedObject.id === vehicle.id;
  const simSpeed = useDigitalTwinStore((s) => s.simulationSpeed);

  const groupRef = useRef<THREE.Group>(null);
  const isMoving =
    (vehicle.status === 'EN_ROUTE' ||
      vehicle.status === 'DEPARTING' ||
      vehicle.status === 'ENTERING_STATION' ||
      vehicle.status === 'REVERSE_PARKING' ||
      vehicle.status === 'LEAVING_STATION') &&
    vehicle.speed > 0;

  const targetRef = useRef({
    x: vehicle.position.x,
    y: vehicle.position.y && vehicle.position.y > 0.1 ? vehicle.position.y : 0.04,
    z: vehicle.position.z,
    heading: vehicle.heading || 0,
    speed: vehicle.speed || 0,
    isMoving,
    status: vehicle.status,
  });

  useEffect(() => {
    targetRef.current.x = vehicle.position.x;
    targetRef.current.y = vehicle.position.y && vehicle.position.y > 0.1 ? vehicle.position.y : 0.04;
    targetRef.current.z = vehicle.position.z;
    targetRef.current.heading = vehicle.heading || 0;
    targetRef.current.speed = vehicle.speed || 0;
    targetRef.current.status = vehicle.status;
    targetRef.current.isMoving =
      (vehicle.status === 'EN_ROUTE' ||
        vehicle.status === 'DEPARTING' ||
        vehicle.status === 'ENTERING_STATION' ||
        vehicle.status === 'REVERSE_PARKING' ||
        vehicle.status === 'LEAVING_STATION') &&
      vehicle.speed > 0;
  }, [vehicle.position.x, vehicle.position.y, vehicle.position.z, vehicle.heading, vehicle.speed, vehicle.status]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(vehicle.position.x, targetRef.current.y, vehicle.position.z);
      groupRef.current.rotation.y = vehicle.heading || 0;
    }
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const clampedDelta = Math.min(delta, 0.05);
    const currentSimSpeed = simSpeed || 1.0;

    const liveVeh = useDigitalTwinStore.getState().vehicles.find((v) => v.id === vehicle.id);
    if (liveVeh) {
      targetRef.current.x = liveVeh.position.x;
      targetRef.current.y = liveVeh.position.y && liveVeh.position.y > 0.1 ? liveVeh.position.y : 0.04;
      targetRef.current.z = liveVeh.position.z;
      targetRef.current.heading = liveVeh.heading || 0;
      targetRef.current.speed = liveVeh.speed || 0;
      targetRef.current.status = liveVeh.status;
      targetRef.current.isMoving = liveVeh.speed > 0.1 && (
        liveVeh.status === 'EN_ROUTE' ||
        liveVeh.status === 'DEPARTING' ||
        liveVeh.status === 'ENTERING_STATION' ||
        liveVeh.status === 'REVERSE_PARKING' ||
        liveVeh.status === 'LEAVING_STATION' ||
        liveVeh.status === 'MANUAL_DRIVE'
      );
    }
    const target = targetRef.current;

    if (isNaN(groupRef.current.position.x) || isNaN(groupRef.current.position.z)) {
      groupRef.current.position.x = target.x || 20.6;
      groupRef.current.position.z = target.z || 29.1;
      groupRef.current.position.y = target.y || 0.04;
      groupRef.current.rotation.y = target.heading || 0;
    }

    // 1. Smooth, natural turn rotation (shortest angular path with exponential dampening)
    let diff = target.heading - groupRef.current.rotation.y;
    diff = THREE.MathUtils.euclideanModulo(diff + Math.PI, Math.PI * 2) - Math.PI;
    const turnRate = Math.abs(diff) > 0.4 ? 10.0 : 7.5;
    groupRef.current.rotation.y += diff * (1 - Math.exp(-turnRate * clampedDelta));

    // 2. High-precision critically damped positional glide (zero wobble, zero snapping, zero drift)
    const errX = target.x - groupRef.current.position.x;
    const errZ = target.z - groupRef.current.position.z;
    const distSq = errX * errX + errZ * errZ;

    if (distSq > 100) {
      groupRef.current.position.x = target.x;
      groupRef.current.position.z = target.z;
      groupRef.current.rotation.y = target.heading;
    } else {
      // Critically damped tracking: perfectly bridges the 100ms server tick interval at silky smooth 60 FPS
      const trackSpeed = target.isMoving ? 14.0 : 20.0;
      const blend = 1 - Math.exp(-trackSpeed * clampedDelta);
      groupRef.current.position.x += errX * blend;
      groupRef.current.position.z += errZ * blend;
    }

    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      target.y,
      12.0,
      clampedDelta
    );
  });

  const isCharging = vehicle.status === 'CHARGING';
  const hasFault = vehicle.status === 'FAULT' || vehicle.status === 'SERVICE_REQUIRED' || vehicle.vehicleHealth === 'CRITICAL';
  const isUnderRepair = vehicle.status === 'UNDER_REPAIR';
  const isQueue = vehicle.status === 'QUEUE';

  const towVehicle = useDigitalTwinStore((s) =>
    vehicle.towedByVehicleId && Array.isArray(s.vehicles)
      ? s.vehicles.find((v) => v.id === vehicle.towedByVehicleId) || null
      : null
  );

  const routePoints = useMemo(() => {
    if (
      !isSelected ||
      isCharging ||
      isQueue ||
      isUnderRepair ||
      !vehicle ||
      vehicle.status === 'ARRIVING' ||
      vehicle.status === 'STRANDED' ||
      vehicle.status === 'BEING_TOWED' ||
      !Array.isArray(vehicle.routeWaypoints) ||
      vehicle.routeWaypoints.length < 2
    ) {
      return null;
    }
    const curX = groupRef.current ? groupRef.current.position.x : vehicle.position?.x ?? 0;
    const curZ = groupRef.current ? groupRef.current.position.z : vehicle.position?.z ?? 0;
    const pts: [number, number, number][] = [
      [curX, 0.12, curZ],
    ];
    const startIndex = Math.max(0, Math.min(vehicle.routeWaypoints.length - 1, vehicle.currentWaypointIndex || 0));
    for (let i = startIndex; i < vehicle.routeWaypoints.length; i++) {
      const wp = vehicle.routeWaypoints[i];
      if (wp && typeof wp.x === 'number' && typeof wp.z === 'number') {
        pts.push([wp.x, 0.12, wp.z]);
      }
    }
    return pts.length > 1 ? pts : null;
  }, [isSelected, isCharging, isQueue, isUnderRepair, vehicle?.status, vehicle?.position?.x, vehicle?.position?.z, vehicle?.routeWaypoints, vehicle?.currentWaypointIndex]);

  return (
    <>
      {towVehicle && towVehicle.position && vehicle.position && (
        <Line
          points={[
            [vehicle.position.x, 0.35, vehicle.position.z],
            [towVehicle.position.x, 0.35, towVehicle.position.z],
          ]}
          color="#f59e0b"
          lineWidth={3.5}
        />
      )}

      {/* AR Navigation Ribbon on road for In-Cabin vehicle */}
      {isInCabinThisVehicle && (
        <ARNavigationRibbon vehicleId={vehicle.id} />
      )}

      {routePoints && !isInCabinThisVehicle && routePoints.length > 1 && (
        <Line
          points={routePoints}
          color={hasFault ? '#ef4444' : '#2563eb'}
          lineWidth={2.0}
          transparent
          opacity={0.7}
        />
      )}

      <group
        ref={groupRef}
        name={`vehicle-${vehicle.id}`}
        userData={{ isVehicle: true, vehicleId: vehicle.id }}
        onClick={(e) => {
          if (inCabinVehicleId) return;
          e.stopPropagation();
          selectVehicle(vehicle.id);
        }}
      >
        <Suspense fallback={<FallbackProceduralCar isSelected={isSelected} hasFault={hasFault} />}>
          <VehicleGLBModel model={vehicle.model} />
        </Suspense>

        {isSelected && !inCabinVehicleId && (
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.35, 1.5, 32]} />
            <meshBasicMaterial
              color={hasFault ? '#ef4444' : '#2563eb'}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {isSelected && !inCabinVehicleId && (
          <SelectedVehicleBadge vehicleId={vehicle.id} />
        )}
      </group>
    </>
  );
}, (prev, next) => {
  return (
    prev.vehicle.id === next.vehicle.id &&
    prev.inCabinVehicleId === next.inCabinVehicleId &&
    prev.vehicle.status === next.vehicle.status &&
    prev.vehicle.model === next.vehicle.model &&
    prev.vehicle.vehicleHealth === next.vehicle.vehicleHealth &&
    prev.vehicle.currentBatteryPct === next.vehicle.currentBatteryPct &&
    prev.vehicle.towedByVehicleId === next.vehicle.towedByVehicleId &&
    prev.vehicle.towingVehicleId === next.vehicle.towingVehicleId &&
    prev.vehicle.currentWaypointIndex === next.vehicle.currentWaypointIndex
  );
});

export function VehicleFleet({ inCabinVehicleId }: { inCabinVehicleId?: string }) {
  const vehicles = useDigitalTwinStore((s) => s.vehicles) || [];

  return (
    <group name="VehicleFleet">
      {vehicles.map((vehicle) => (
        <VehicleItem key={vehicle.id} vehicle={vehicle} inCabinVehicleId={inCabinVehicleId} />
      ))}
    </group>
  );
}
