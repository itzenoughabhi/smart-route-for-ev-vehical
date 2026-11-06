'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';

interface ARNavigationRibbonProps {
  vehicleId: string;
}

export const ARNavigationRibbon = React.memo(function ARNavigationRibbon({ vehicleId }: ARNavigationRibbonProps) {
  const vehicle = useDigitalTwinStore((s) =>
    Array.isArray(s.vehicles) ? s.vehicles.find((v) => v.id === vehicleId || v.code === vehicleId) : null
  );

  const chevronsGroupRef = useRef<THREE.Group>(null);
  const ribbonMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Compute smooth ribbon curve points along upcoming route
  const { ribbonGeometry, chevronPositions, hasRoute } = useMemo(() => {
    if (!vehicle || !vehicle.position) {
      return { ribbonGeometry: null, chevronPositions: [], hasRoute: false };
    }

    const curX = vehicle.position.x;
    const curZ = vehicle.position.z;
    const heading = vehicle.heading || 0;
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);

    const rawPoints: THREE.Vector3[] = [];
    rawPoints.push(new THREE.Vector3(curX + fwdX * 1.5, 0.08, curZ + fwdZ * 1.5));

    if (Array.isArray(vehicle.routeWaypoints) && vehicle.routeWaypoints.length > 1) {
      const startIdx = Math.max(0, vehicle.currentWaypointIndex || 0);
      const upcoming = vehicle.routeWaypoints.slice(startIdx, startIdx + 18);
      for (const wp of upcoming) {
        if (wp && typeof wp.x === 'number' && typeof wp.z === 'number') {
          rawPoints.push(new THREE.Vector3(wp.x, 0.08, wp.z));
        }
      }
    }

    // If route waypoints are sparse, synthesize a smooth forward lane preview
    if (rawPoints.length < 4) {
      for (let i = 1; i <= 14; i++) {
        const dist = 1.5 + i * 3.6;
        rawPoints.push(new THREE.Vector3(curX + fwdX * dist, 0.08, curZ + fwdZ * dist));
      }
    }

    // Subsample into smooth curve
    let curvePoints: THREE.Vector3[] = [];
    if (rawPoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(rawPoints);
      curvePoints = curve.getPoints(Math.min(60, rawPoints.length * 4));
    } else {
      curvePoints = rawPoints;
    }

    if (curvePoints.length < 2) {
      return { ribbonGeometry: null, chevronPositions: [], hasRoute: false };
    }

    // Build ribbon quad strip
    const halfWidth = 0.95; // ~1.9m wide, centered in road lane
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const chevrons: { pos: THREE.Vector3; angle: number }[] = [];
    let accumulatedDist = 0;
    let nextChevronDist = 3.0;

    for (let i = 0; i < curvePoints.length; i++) {
      const pt = curvePoints[i];
      let tangent = new THREE.Vector3();

      if (i === 0) {
        tangent.subVectors(curvePoints[1], curvePoints[0]).normalize();
      } else if (i === curvePoints.length - 1) {
        tangent.subVectors(curvePoints[i], curvePoints[i - 1]).normalize();
      } else {
        tangent.subVectors(curvePoints[i + 1], curvePoints[i - 1]).normalize();
      }

      // Normal perpendicular to tangent in horizontal plane
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

      const left = new THREE.Vector3().copy(pt).addScaledVector(normal, halfWidth);
      const right = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfWidth);

      vertices.push(left.x, pt.y, left.z);
      vertices.push(right.x, pt.y, right.z);

      const vNorm = i / (curvePoints.length - 1);
      uvs.push(0, vNorm);
      uvs.push(1, vNorm);

      if (i > 0) {
        const segDist = pt.distanceTo(curvePoints[i - 1]);
        accumulatedDist += segDist;

        if (accumulatedDist >= nextChevronDist && chevrons.length < 12) {
          const yaw = Math.atan2(tangent.x, tangent.z);
          chevrons.push({
            pos: new THREE.Vector3(pt.x, pt.y + 0.02, pt.z),
            angle: yaw,
          });
          nextChevronDist += 3.8; // every 3.8 meters
        }

        const base = (i - 1) * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { ribbonGeometry: geo, chevronPositions: chevrons, hasRoute: true };
  }, [vehicle?.currentWaypointIndex, vehicle?.routeWaypoints?.length]);

  // Pulse & animate chevrons flowing forward down the lane
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (chevronsGroupRef.current) {
      chevronsGroupRef.current.children.forEach((child, idx) => {
        const phase = (t * 2.2 + idx * 0.45) % (Math.PI * 2);
        const scale = 1.0 + Math.sin(phase) * 0.12;
        child.scale.set(scale, 1, scale);
      });
    }
    if (ribbonMatRef.current) {
      const pulse = 0.55 + Math.sin(t * 3.0) * 0.12;
      ribbonMatRef.current.opacity = pulse;
    }
  });

  if (!hasRoute || !ribbonGeometry) return null;

  return (
    <group name="ARNavigationRibbon">
      {/* 1. Glowing cyan road carpet ribbon */}
      <mesh geometry={ribbonGeometry}>
        <meshBasicMaterial
          ref={ribbonMatRef}
          color="#00c8ff"
          transparent
          opacity={0.65}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Pulsing forward chevron arrows (> > > >) */}
      <group ref={chevronsGroupRef}>
        {chevronPositions.map((c, idx) => (
          <group key={`chev-${idx}`} position={c.pos} rotation={[0, c.angle, 0]}>
            {/* White arrow chevron V */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.42, 0.75, 3]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.92}
                depthWrite={false}
              />
            </mesh>
            {/* Cyan halo outline around arrow */}
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 1.25, 1]}>
              <coneGeometry args={[0.44, 0.8, 3]} />
              <meshBasicMaterial
                color="#00e5ff"
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});
