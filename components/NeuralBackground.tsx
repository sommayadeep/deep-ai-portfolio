"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group, Points as TPoints } from "three";

type Props = {
  signalLevel: number;
  reducedEffects?: boolean;
};

function NeuralSystem({ signalLevel, reducedEffects = false }: Props) {
  const pointsRef = useRef<TPoints>(null);
  const groupRef = useRef<Group>(null);

  const { nodes, edges } = useMemo(() => {
    const count = 140;
    const positions: [number, number, number][] = [];

    for (let i = 0; i < count; i++) {
      const r = 2.65 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)]);
    }

    const linePairs: [number, number][] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i][0] - positions[j][0];
        const dy = positions[i][1] - positions[j][1];
        const dz = positions[i][2] - positions[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.8 && linePairs.length < 260) linePairs.push([i, j]);
      }
    }

    const buffer = new Float32Array(positions.length * 3);
    positions.forEach((p, i) => {
      buffer[i * 3] = p[0];
      buffer[i * 3 + 1] = p[1];
      buffer[i * 3 + 2] = p[2];
    });

    return { nodes: buffer, edges: linePairs.map(([a, b]) => [positions[a], positions[b]] as [[number, number, number], [number, number, number]]) };
  }, []);

  useFrame((state, delta) => {
    if (reducedEffects) return;
    const pulse = 0.95 + Math.sin(state.clock.elapsedTime * (0.8 + signalLevel * 0.15)) * 0.06;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.11) * 0.2;
      groupRef.current.scale.setScalar(pulse + signalLevel * 0.03);
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {edges.map((pair, idx) => (
        <Line key={idx} points={pair} color={signalLevel > 2 ? "#93c5fd" : "#59f6ff"} lineWidth={0.45} transparent opacity={0.22 + signalLevel * 0.08} />
      ))}
      <Points ref={pointsRef} positions={nodes} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={signalLevel > 2 ? "#93c5fd" : "#59f6ff"} size={0.03 + signalLevel * 0.002} sizeAttenuation depthWrite={false} />
      </Points>
    </group>
  );
}

export default function NeuralBackground({ signalLevel, reducedEffects = false }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-75">
      <Canvas
        camera={{ position: [0, 0, 4] }}
        dpr={reducedEffects ? 1 : [1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.9} />
        <NeuralSystem signalLevel={signalLevel} reducedEffects={reducedEffects} />
      </Canvas>
    </div>
  );
}
