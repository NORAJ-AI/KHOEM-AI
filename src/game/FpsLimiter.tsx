import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGame } from './store';

/** The canvas renders on demand; this drives it at 30 or 60 FPS (saves battery on 30). */
export function FpsLimiter() {
  const invalidate = useThree((s) => s.invalidate);
  const fps = useGame((s) => s.settings.fps);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (t - last >= interval - 2) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);

  return null;
}
