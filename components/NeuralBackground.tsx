"use client";

import { Canvas } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Points as TPoints } from "three";
import { useFrame } from "@react-three/fiber";

function NeuralPoints() {
  const ref = useRef<TPoints>(null);

  const sphere = useMemo(() => {
    const positions = new Float32Array(1800);
    for (let i = 0; i < 1800; i += 3) {
      const r = 2.7 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.12;
  });

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#59f6ff" size={0.02} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

export default function NeuralBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.8} />
        <NeuralPoints />
      </Canvas>
    </div>
  );
}
