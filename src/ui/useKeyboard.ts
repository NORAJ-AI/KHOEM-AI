import { useEffect } from 'react';
import { input } from '../game/shared';
import { useGame } from '../game/store';

/** Desktop keyboard controls (handy for testing in a browser): WASD/arrows, Space, J, E, Shift, Esc. */
export function useKeyboard(): void {
  useEffect(() => {
    const keys = new Set<string>();

    const refresh = () => {
      input.keyX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      input.keyY = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
      input.brake = keys.has('shift');
    };

    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ') input.jump = true;
      else if (k === 'j') input.attack = true;
      else if (k === 'e') input.interact = true;
      else if (k === 'escape') {
        const g = useGame.getState();
        if (g.screen === 'playing') g.pause();
        else if (g.screen === 'paused') g.resume();
      }
      keys.add(k);
      refresh();
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      refresh();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}
