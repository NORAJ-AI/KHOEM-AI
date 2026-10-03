import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PICKUPS } from './constants';
import { useGame } from './store';

const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
coinGeo.rotateX(Math.PI / 2);
const gemGeo = new THREE.OctahedronGeometry(0.5);
const coinMat = new THREE.MeshLambertMaterial({ color: '#ffc928', emissive: '#7a5a00' });
const gemMat = new THREE.MeshLambertMaterial({ color: '#4de1ff', emissive: '#0a6a85' });

export function Pickups() {
  const collected = useGame((s) => s.collected);
  const group = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      c.rotation.y += Math.min(dt, 0.05) * 2.2;
      c.position.y = 0.9 + Math.sin(t * 2 + i) * 0.12;
    });
  });

  return (
    <group ref={group}>
      {PICKUPS.filter((p) => !collected.includes(p.id)).map((p) => (
        <mesh
          key={p.id}
          position={[p.x, 0.9, p.z]}
          geometry={p.kind === 'gem' ? gemGeo : coinGeo}
          material={p.kind === 'gem' ? gemMat : coinMat}
        />
      ))}
    </group>
  );
}
