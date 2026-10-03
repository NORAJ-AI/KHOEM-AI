// Optional light rain (Settings -> Rain). Part of the weather system hook: more weather types can be added here later.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shared } from './shared';
import { useGame } from './store';

const COUNT = 350;
const AREA = 40;
const HEIGHT = 22;

export function Rain() {
  const enabled = useGame((s) => s.settings.rain);
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] = (Math.random() - 0.5) * AREA;
      a[i * 3 + 1] = Math.random() * HEIGHT;
      a[i * 3 + 2] = (Math.random() - 0.5) * AREA;
    }
    return a;
  }, []);

  useFrame((_, dtRaw) => {
    const pts = points.current;
    if (!pts || !enabled) return;
    const dt = Math.min(dtRaw, 0.05);
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= 24 * dt;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = HEIGHT;
    }
    attr.needsUpdate = true;
    const t = shared.driving ? shared.vehicle : shared.player;
    pts.position.set(t.x, 0, t.z);
  });

  if (!enabled) return null;
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#cfe8ff" size={0.12} transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}
