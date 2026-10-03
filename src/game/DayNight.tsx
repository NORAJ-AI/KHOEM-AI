// Day / night cycle: sun & moon light, sky + fog colour, lit windows. Night stays readable.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { setDaylight } from './audio';
import { shared } from './shared';
import { useGame } from './store';
import { windowMat } from './World';

const SKY_DAY = new THREE.Color('#8ed1ff');
const SKY_DUSK = new THREE.Color('#f4a26a');
const SKY_NIGHT = new THREE.Color('#12204a');
const SUN = new THREE.Color('#fff1d6');
const SUNSET = new THREE.Color('#ffb36b');
const MOON = new THREE.Color('#7f94d6');
const GROUND_DAY = new THREE.Color('#5f7f4a');
const GROUND_NIGHT = new THREE.Color('#1d2a3d');

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function DayNight() {
  const scene = useThree((s) => s.scene);
  const quality = useGame((s) => s.settings.quality);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sky = useMemo(() => new THREE.Color(), []);
  const shadows = quality !== 'low';
  const mapSize = quality === 'high' ? 2048 : 1024;

  useEffect(() => {
    scene.add(target);
    scene.fog = new THREE.Fog('#8ed1ff', 40, 120);
    scene.background = new THREE.Color('#8ed1ff');
    return () => {
      scene.remove(target);
    };
  }, [scene, target]);

  useFrame(() => {
    const h = shared.hours;
    const elev = Math.sin(((h - 6) / 24) * Math.PI * 2); // 1 at noon, -1 at midnight
    const day = smooth(-0.12, 0.3, elev);
    const dusk = Math.max(0, 1 - Math.abs(elev) / 0.28);
    shared.daylight = day;
    setDaylight(day);

    sky.copy(SKY_NIGHT).lerp(SKY_DAY, day).lerp(SKY_DUSK, dusk * 0.6);
    (scene.background as THREE.Color).copy(sky);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(sky);

    const light = sun.current;
    if (light) {
      const p = shared.player;
      const ang = ((h - 6) / 12) * Math.PI; // sun path across the sky
      const height = Math.max(0.35, Math.abs(elev)) * 45;
      light.position.set(p.x + Math.cos(ang) * 40, height, p.z + 18);
      target.position.set(p.x, 0, p.z);
      light.target = target;
      light.intensity = 0.35 + 1.9 * day;
      light.color.copy(MOON).lerp(SUN, day).lerp(SUNSET, dusk * 0.5);
    }
    if (hemi.current) {
      hemi.current.intensity = 0.5 + 0.55 * day;
      hemi.current.color.copy(sky).lerp(new THREE.Color('#ffffff'), 0.35);
      hemi.current.groundColor.copy(GROUND_NIGHT).lerp(GROUND_DAY, day);
    }
    windowMat.opacity = (1 - day) * 0.95;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#bfe3ff', '#5f7f4a', 1]} />
      <directionalLight
        key={`${shadows}-${mapSize}`}
        ref={sun}
        castShadow={shadows}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-bias={-0.0005}
      />
    </>
  );
}
