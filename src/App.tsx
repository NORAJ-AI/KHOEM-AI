// KHOEM-AI - main entry: 3D scene + touch UI.
// The game is split into small modules (see src/game): player, vehicle, enemies, npc, missions,
// store (save/load/progress), audio, day-night, camera, and so on.

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraRig } from './game/CameraRig';
import { DayNight } from './game/DayNight';
import { Enemies } from './game/Enemies';
import { FpsLimiter } from './game/FpsLimiter';
import { GameLogic } from './game/GameLogic';
import { MissionMarker } from './game/MissionMarker';
import { Npc, TrafficCar } from './game/Npc';
import { Pickups } from './game/Pickups';
import { Player } from './game/Player';
import { Rain } from './game/Rain';
import { Vehicle } from './game/Vehicle';
import { World } from './game/World';
import { initAudio } from './game/audio';
import { useGame } from './game/store';
import { HUD } from './ui/HUD';
import { MainMenu, PauseMenu } from './ui/Menus';
import { RaceHud } from './ui/RaceHud';
import { useKeyboard } from './ui/useKeyboard';

const QUALITY = {
  low: { dpr: 0.7, shadows: false, aa: false },
  medium: { dpr: 1, shadows: true, aa: false },
  high: { dpr: Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio, 1.75), shadows: true, aa: true },
} as const;

function Scene() {
  return (
    <>
      <FpsLimiter />
      <DayNight />
      <World />
      <Pickups />
      <MissionMarker />
      <Player />
      <Vehicle />
      <Npc />
      <TrafficCar />
      <Enemies />
      <Rain />
      <CameraRig />
      <GameLogic />
    </>
  );
}

export default function App() {
  const quality = useGame((s) => s.settings.quality);
  const screen = useGame((s) => s.screen);
  const q = QUALITY[quality];
  useKeyboard();

  // Autosave when the page is closed or the app goes to the background.
  useEffect(() => {
    const save = () => useGame.getState().save();
    const onHide = () => {
      if (document.hidden) {
        const g = useGame.getState();
        if (g.screen === 'playing') g.pause();
        else g.save();
      }
    };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  return (
    <div
      className="app"
      onPointerDownCapture={() => initAudio()} // browsers only allow audio after a tap
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        key={quality}
        frameloop="demand"
        shadows={q.shadows}
        dpr={q.dpr}
        camera={{ fov: 60, near: 0.1, far: 220, position: [10, 17, 46] }}
        gl={{ antialias: q.aa, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
      {screen === 'playing' && <HUD />}
      {screen === 'playing' && <RaceHud />}
      {screen === 'menu' && <MainMenu />}
      {screen === 'paused' && <PauseMenu />}
    </div>
  );
}
