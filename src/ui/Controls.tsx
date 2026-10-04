// Touch controls: floating joystick (left), swipe-to-look pad (right), action buttons.

import { type PointerEvent as RPointerEvent, type ReactNode, useRef, useState } from 'react';
import { input, shared } from '../game/shared';
import { useGame } from '../game/store';
import { sfx } from '../game/audio';
import { useT } from './useT';
import { useHudPoll } from './useHudPoll';

const RADIUS = 56;

export function Joystick() {
  const zone = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: RPointerEvent, o: { x: number; y: number }) => {
    const rect = zone.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = e.clientX - rect.left - o.x;
    let dy = e.clientY - rect.top - o.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    input.joyX = dx / RADIUS;
    input.joyY = -dy / RADIUS;
  };

  const reset = () => {
    pid.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    input.joyX = 0;
    input.joyY = 0;
  };

  return (
    <div
      ref={zone}
      className="joyzone"
      onPointerDown={(e) => {
        if (pid.current !== null) return;
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        const o = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setOrigin(o);
        update(e, o);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === pid.current && origin) update(e, origin);
      }}
      onPointerUp={(e) => {
        if (e.pointerId === pid.current) reset();
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === pid.current) reset();
      }}
    >
      <div
        className={`joybase ${origin ? 'active' : ''}`}
        style={origin ? { left: origin.x, top: origin.y } : undefined}
      >
        <div className="joyknob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
    </div>
  );
}

/** Drag anywhere on the right half of the screen to look around. */
export function LookPad() {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div
      className="lookpad"
      onPointerDown={(e) => {
        if (last.current) return;
        last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        input.lookDX += e.clientX - l.x;
        input.lookDY += e.clientY - l.y;
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={(e) => {
        if (last.current?.id === e.pointerId) last.current = null;
      }}
      onPointerCancel={(e) => {
        if (last.current?.id === e.pointerId) last.current = null;
      }}
    />
  );
}

function Btn({
  cls, onDown, onUp, children, label, disabled,
}: {
  cls: string;
  onDown: () => void;
  onUp?: () => void;
  children: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={`abtn ${cls} ${disabled ? 'dim' : ''}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="ico">{children}</span>
      <span className="lbl">{label}</span>
    </button>
  );
}

export function ActionButtons() {
  const t = useT();
  const snap = useHudPoll();
  const tutorial = useGame((s) => s.tutorial);
  void tutorial;

  const interactLabel =
    snap.nearby === 'race' ? t('raceBtn') : snap.nearby === 'npc' ? t('talk') : snap.nearby === 'car' ? t('enter') : snap.nearby === 'exit' ? t('exit') : t('talk');
  const interactIcon = snap.nearby === 'race' ? '🏁' : snap.nearby === 'car' ? '🚗' : snap.nearby === 'exit' ? '🚪' : '💬';

  return (
    <div className="actions">
      <Btn cls="b-interact" disabled={snap.nearby === 'none'} label={interactLabel} onDown={() => { input.interact = true; }}>
        {interactIcon}
      </Btn>
      {snap.driving ? (
        <Btn
          cls="b-main"
          label={t('brake')}
          onDown={() => { input.brake = true; sfx('click'); }}
          onUp={() => { input.brake = false; }}
        >
          🛑
        </Btn>
      ) : (
        <>
          <Btn cls="b-jump" label={t('jump')} onDown={() => { input.jump = true; }}>
            ⬆️
          </Btn>
          <Btn cls="b-main" label={t('attack')} onDown={() => { input.attack = true; }}>
            👊
          </Btn>
        </>
      )}
    </div>
  );
}

export { shared };
