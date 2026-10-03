import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp, input, lerpAngle, shared } from './shared';
import { useGame } from './store';

/** Third-person camera. Swipe to orbit; while driving it swings in behind the car. Orbits the town on the menu. */
export function CameraRig() {
  const want = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const menuAngle = useRef(0);

  useFrame((state, dtRaw) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(dtRaw, 0.05);
    const screen = useGame.getState().screen;

    // Wider vertical FOV in portrait so the sides aren't cramped.
    const fov = cam.aspect < 1 ? 78 : 60;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    if (screen === 'menu') {
      menuAngle.current += dt * 0.12;
      want.current.set(10 + Math.cos(menuAngle.current) * 40, 17, 6 + Math.sin(menuAngle.current) * 40);
      look.current.set(10, 2, 6);
      cam.position.lerp(want.current, 1 - Math.exp(-3 * dt));
      cam.lookAt(look.current);
      return;
    }
    if (screen !== 'playing') return;

    shared.camYaw -= input.lookDX * 0.006;
    shared.camPitch = clamp(shared.camPitch + input.lookDY * 0.004, 0.12, 0.95);
    input.lookDX = 0;
    input.lookDY = 0;

    const driving = shared.driving;
    const tgt = driving ? shared.vehicle : shared.player;
    if (driving && Math.abs(shared.vehicle.speed) > 2) {
      shared.camYaw = lerpAngle(shared.camYaw, shared.vehicle.yaw + Math.PI, 1 - Math.exp(-2.2 * dt));
    }
    const dist = driving ? 9.5 : 6.5;
    const cp = Math.cos(shared.camPitch);
    const sp = Math.sin(shared.camPitch);
    const ty = (driving ? 1.2 : 1.5) + (driving ? 0 : shared.player.y);
    look.current.set(tgt.x, ty, tgt.z);
    want.current.set(
      tgt.x + Math.sin(shared.camYaw) * cp * dist,
      ty + sp * dist,
      tgt.z + Math.cos(shared.camYaw) * cp * dist,
    );
    cam.position.lerp(want.current, 1 - Math.exp(-10 * dt));
    cam.lookAt(look.current);
  });

  return null;
}
