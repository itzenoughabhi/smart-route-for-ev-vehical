'use client';

import React from 'react';
import { useDigitalTwinStore } from '../../store/useDigitalTwinStore';

export function IncidentMarkers({ isCabin }: { isCabin?: boolean }) {
  const stations = useDigitalTwinStore((s) => s.stations);
  const selectStation = useDigitalTwinStore((s) => s.selectStation);

  const faultedStations = stations.filter((s) =>
    s.chargers.some((c) => c.status === 'FAULT')
  );

  return (
    <group name="IncidentMarkers">
      {faultedStations.map((st) => (
        <group
          key={`inc-${st.id}`}
          position={[st.position.x, 4.8, st.position.z]}
          onClick={(e) => {
            if (isCabin) return;
            e.stopPropagation();
            selectStation(st.id);
          }}
        >
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
