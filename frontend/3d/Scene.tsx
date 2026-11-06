'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDigitalTwinStore } from '../store/useDigitalTwinStore';
import { CitySky } from './Environment/CitySky';
import { RoadNetwork } from './Roads/RoadNetwork';
import { TrafficSignals3D } from './Roads/TrafficSignals3D';
import { DebugOverlay3D } from './Roads/DebugOverlay3D';
import { Buildings } from './City/Buildings';
import { CityProps } from './Environment/CityProps';
import { ChargingStation } from './Stations/ChargingStation';
import { VehicleFleet } from './Vehicles/VehicleFleet';
import { IncidentMarkers } from './InteractiveMarkers/IncidentMarker';
import { PowerGridSystem } from './Grid/PowerGridSystem';
import { ServiceCenter3D } from './ServiceCenter/ServiceCenter3D';
import { HomeChargers3D } from './Residential/HomeChargers3D';

interface CameraRigProps {
  mode?: 'OVERVIEW' | 'IN_CABIN';
  activeVehicleId?: string;
}

function CameraRig({ mode = 'OVERVIEW', activeVehicleId }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const cameraTarget = useDigitalTwinStore((s) => s.cameraTarget);
  const cameraPosition = useDigitalTwinStore((s) => s.cameraPosition);
  const trackingVehicleId = useDigitalTwinStore((s) => s.trackingVehicleId);
  const isPanMode = useDigitalTwinStore((s) => s.isPanMode);

  const targetVec = useRef(new THREE.Vector3(...cameraTarget));
  const posVec = useRef(new THREE.Vector3(...cameraPosition));
  const isTransitioning = useRef(false);
  const isUserInteracting = useRef(false);

  const currentHeading = useRef(0);
  const isHeadingInit = useRef(false);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      if (mode === 'IN_CABIN') {
        camera.fov = 56;
        camera.near = 0.05;
        camera.far = 1200;
      } else {
        camera.fov = 38;
        camera.near = 0.1;
        camera.far = 1000;
      }
      camera.updateProjectionMatrix();
    }
  }, [mode, camera]);

  useEffect(() => {
    if (mode === 'OVERVIEW') {
      targetVec.current.set(...cameraTarget);
      posVec.current.set(...cameraPosition);
      if (!isUserInteracting.current) {
        isTransitioning.current = true;
      }
    }
  }, [cameraTarget, cameraPosition, mode]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // ========================================================
    // 1. FIRST-PERSON IN-CABIN DRIVER WINDSHIELD PERSPECTIVE
    // ========================================================
    if (mode === 'IN_CABIN') {
      const targetId = activeVehicleId || trackingVehicleId;
      const vehObj = targetId ? state.scene.getObjectByName(`vehicle-${targetId}`) : null;

      let vX: number, vY: number, vZ: number, vHeading: number;

      if (vehObj) {
        vX = vehObj.position.x;
        vY = vehObj.position.y || 0.04;
        vZ = vehObj.position.z;
        vHeading = vehObj.rotation.y;
      } else {
        const vehicles = useDigitalTwinStore.getState().vehicles;
        const veh = vehicles.find((v) => v.id === targetId || v.code === targetId) || vehicles[0];
        if (!veh) return;
        vX = veh.position.x;
        vY = veh.position.y || 0.04;
        vZ = veh.position.z;
        vHeading = veh.heading || 0;
      }

      // Smooth heading tracking with exponential filter
      if (!isHeadingInit.current) {
        currentHeading.current = vHeading;
        isHeadingInit.current = true;
      } else {
        let diff = vHeading - currentHeading.current;
        diff = THREE.MathUtils.euclideanModulo(diff + Math.PI, Math.PI * 2) - Math.PI;
        const headingBlend = 1 - Math.exp(-8.5 * Math.min(delta, 0.05));
        currentHeading.current += diff * headingBlend;
      }

      // Driver head is rigidly mounted inside the vehicle chassis frame
      const chassisHeading = vHeading;
      const fwdX = Math.sin(chassisHeading);
      const fwdZ = Math.cos(chassisHeading);
      const rightX = Math.cos(chassisHeading);
      const rightZ = -Math.sin(chassisHeading);

      // Seated in right-hand driver seat inside cabin, eye level looking through windshield
      const eyeX = vX + fwdX * 0.92 + rightX * 0.26;
      const eyeY = vY + 1.22;
      const eyeZ = vZ + fwdZ * 0.92 + rightZ * 0.26;

      // Subtle dynamic apex look-ahead when cornering
      let turnDiff = vHeading - currentHeading.current;
      turnDiff = THREE.MathUtils.euclideanModulo(turnDiff + Math.PI, Math.PI * 2) - Math.PI;
      const turnApexLook = THREE.MathUtils.clamp(turnDiff * 0.25, -0.15, 0.15);

      // Subtle driver glance with mouse pointer
      const headYaw = state.pointer.x * 0.12;
      const headPitch = THREE.MathUtils.clamp(state.pointer.y * 0.07, -0.12, 0.12);

      // Balanced lookahead distance down the highway lane (24m ensures ultra-smooth panoramic turns)
      const lookDist = 24.0;
      const lookAngle = currentHeading.current + turnApexLook - headYaw;
      const targetX = eyeX + Math.sin(lookAngle) * lookDist;
      const targetY = eyeY - 0.06 + headPitch * 2.8;
      const targetZ = eyeZ + Math.cos(lookAngle) * lookDist;

      // Critically damped spring interpolation eliminates 100% of turn jitter and frame-sync hitches
      camera.position.x = THREE.MathUtils.damp(camera.position.x, eyeX, 24, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, eyeY, 24, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, eyeZ, 24, delta);

      controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, targetX, 16, delta);
      controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, targetY, 16, delta);
      controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, targetZ, 16, delta);

      controlsRef.current.update();
      return;
    }

    // ========================================================
    // 2. OVERVIEW / THIRD-PERSON ORBIT MODE
    // ========================================================
    if (trackingVehicleId) {
      const vehObj = state.scene.getObjectByName(`vehicle-${trackingVehicleId}`);
      let trackX: number, trackY: number, trackZ: number;

      if (vehObj) {
        trackX = vehObj.position.x;
        trackY = vehObj.position.y || 0.8;
        trackZ = vehObj.position.z;
      } else {
        const vehicles = useDigitalTwinStore.getState().vehicles;
        const veh = vehicles.find((v) => v.id === trackingVehicleId);
        if (!veh) return;
        trackX = veh.position.x;
        trackY = 0.8;
        trackZ = veh.position.z;
      }

      controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, trackX, 10, delta);
      controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, 0.8, 10, delta);
      controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, trackZ, 10, delta);

      if (!isUserInteracting.current) {
        const targetCamX = trackX + 12;
        const targetCamY = 10;
        const targetCamZ = trackZ + 14;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 6.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6.5, delta);
      }

      controlsRef.current.update();
      return;
    }

    if (isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z)) {
      camera.position.set(68, 56, 68);
    }
    if (isNaN(controlsRef.current.target.x) || isNaN(controlsRef.current.target.y) || isNaN(controlsRef.current.target.z)) {
      controlsRef.current.target.set(6, 1, 8);
    }

    if (isTransitioning.current && !isUserInteracting.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, posVec.current.x, 3.8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, posVec.current.y, 3.8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, posVec.current.z, 3.8, delta);

      controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, targetVec.current.x, 4.2, delta);
      controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, targetVec.current.y, 4.2, delta);
      controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, targetVec.current.z, 4.2, delta);

      controlsRef.current.update();

      const posDistSq = camera.position.distanceToSquared(posVec.current);
      const targetDistSq = controlsRef.current.target.distanceToSquared(targetVec.current);
      if (posDistSq < 0.05 && targetDistSq < 0.05) {
        camera.position.copy(posVec.current);
        controlsRef.current.target.copy(targetVec.current);
        isTransitioning.current = false;
      }
    } else {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.06}
      panSpeed={1.8}
      screenSpacePanning={true}
      maxPolarAngle={mode === 'IN_CABIN' ? Math.PI / 1.9 : Math.PI / 2.15}
      minDistance={mode === 'IN_CABIN' ? 0.01 : 6}
      maxDistance={mode === 'IN_CABIN' ? 80 : 320}
      enableRotate={mode !== 'IN_CABIN'}
      enableZoom={mode !== 'IN_CABIN'}
      enablePan={mode !== 'IN_CABIN'}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      mouseButtons={{
        LEFT: isPanMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      onStart={() => {
        isUserInteracting.current = true;
        isTransitioning.current = false;
      }}
      onEnd={() => {
        isUserInteracting.current = false;
        if (controlsRef.current) {
          posVec.current.copy(camera.position);
          targetVec.current.copy(controlsRef.current.target);
        }
      }}
    />
  );
}

const StationsList = React.memo(function StationsList({ isCabin }: { isCabin?: boolean }) {
  const stations = useDigitalTwinStore((s) => s.stations);
  return (
    <group name="StationsGroup">
      {stations.map((station) => (
        <ChargingStation key={station.id} station={station} isCabin={isCabin} />
      ))}
    </group>
  );
});

export interface DigitalTwinSceneProps {
  mode?: 'OVERVIEW' | 'IN_CABIN';
  activeVehicleId?: string;
}

export const DigitalTwinScene = React.memo(function DigitalTwinScene({
  mode = 'OVERVIEW',
  activeVehicleId,
}: DigitalTwinSceneProps) {
  const clearSelection = useDigitalTwinStore((s) => s.clearSelection);
  const isPanMode = useDigitalTwinStore((s) => s.isPanMode);
  const trackingVehicleId = useDigitalTwinStore((s) => s.trackingVehicleId);

  const effectiveInCabinId = mode === 'IN_CABIN' ? (activeVehicleId || trackingVehicleId || undefined) : undefined;

  useEffect(() => {
    if (mode === 'IN_CABIN') {
      clearSelection();
    }
  }, [mode, clearSelection]);

  return (
    <div className={`w-full h-full relative select-none ${mode === 'IN_CABIN' ? 'pointer-events-none' : isPanMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <Canvas
        shadows={mode !== 'IN_CABIN'}
        dpr={[1, 1.25]}
        camera={{ position: [68, 56, 68], fov: mode === 'IN_CABIN' ? 56 : 38 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        onPointerMissed={(e) => {
          if (e.target === e.currentTarget && mode !== 'IN_CABIN') {
            clearSelection();
          }
        }}
      >
        <CitySky />
        <CameraRig mode={mode} activeVehicleId={activeVehicleId} />

        <RoadNetwork />
        <TrafficSignals3D />

        <DebugOverlay3D />

        <Buildings />

        <CityProps />

        <PowerGridSystem />

        <ServiceCenter3D />

        <HomeChargers3D />

        <StationsList isCabin={mode === 'IN_CABIN'} />

        <VehicleFleet inCabinVehicleId={effectiveInCabinId} />

        <IncidentMarkers isCabin={mode === 'IN_CABIN'} />
      </Canvas>
    </div>
  );
});
