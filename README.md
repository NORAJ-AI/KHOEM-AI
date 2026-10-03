# KHOEM-AI

ហ្គេម 3D Action · Exploration · Driving សម្រាប់ទូរសព្ទ (Version 1 – Prototype)
An original 3D mobile action-adventure prototype built with React + TypeScript + Three.js.

## Run (Termux or any computer)

```bash
npm install
npm run dev      # open the shown http://...:5173 address in the phone browser
npm run build    # production build into dist/
```

## Play on the phone without Termux building

Push to `main`; the GitHub Action builds the game and publishes it with GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).

## Controls

| Touch | Keyboard |
|---|---|
| Left joystick – move / steer | WASD or arrows |
| Swipe right half – look | – |
| Jump / Attack / Talk-Enter-Exit / Brake | Space / J / E / Shift |
| ⏸ – pause, upgrades, inventory, settings | Esc |

## Version 1 contents

3D character · small open map (home, town, roads, river + bridge, hills, trees) · third-person camera ·
walk/run/jump · driveable car · NPC (Sok) · 4 missions (drive, collect, defeat, go-to) · enemy AI ·
combat · coins and hidden crystals · upgrades · inventory · mini-map · day/night cycle · optional rain ·
checkpoints/respawn · save/load (localStorage) · menus · tutorial · synthesized sound · Low/Medium/High graphics, 30/60 FPS · Khmer + English.

## Code map (`src/`)

- `App.tsx` – canvas + UI composition
- `game/` – constants (map), shared (per-frame state), store (progress/save), missions, ai, combat, audio,
  Player, Vehicle, Enemies, Npc, World, DayNight, CameraRig, GameLogic, Pickups, Rain
- `ui/` – HUD, Menus, Controls (joystick/buttons), MiniMap

All models, sounds and visuals are generated in code – no copyrighted assets.
