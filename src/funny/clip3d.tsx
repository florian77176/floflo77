import React from 'react';
import {interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rounded} from '../fonts';
import {funny} from './config';

const {colors} = funny;
const CW = 1080; // taille des clips 3D (tools/parallax.py)
const CH = 1920;
const CLIP_FRAMES = 96;

// Même mouvement de caméra que tools/parallax.py : un point vu à (x0, y0) sur la 1re image,
// de profondeur d (0 = loin, 1 = proche), se retrouve ici à l'image `frame`.
const track = (x0: number, y0: number, d: number, orbit: number, frame: number) => {
  const t = Math.min(frame, CLIP_FRAMES - 1) / (CLIP_FRAMES - 1);
  const e = 1 - (1 - t) ** 2.2;
  const s = 1 + e * (0.07 + 0.15 * d);
  return {
    x: CW / 2 + (x0 * CW - CW / 2) * s + 0.025 * CW * orbit * (d - 0.5) * e * s,
    y: CH / 2 + (y0 * CH - CH / 2) * s,
  };
};

export type Annotation =
  // trait de mesure vertical avec sa hauteur (ex. « 5,3 m »)
  | {kind: 'measure'; x: number; top: number; bottom: number; dTop: number; dBottom: number; label: string; at: number}
  // flèche dessinée d'une étiquette vers un détail
  | {kind: 'arrow'; from: [number, number]; to: [number, number]; dFrom: number; dTo: number; label: string; at: number};

const outline = (w: number) => ({stroke: '#111', strokeWidth: w + 10, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'});
const ink = (w: number) => ({stroke: '#fff', strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'});

const Label: React.FC<{x: number; y: number; text: string; pop: number; big?: boolean}> = ({x, y, text, pop, big}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${pop}) rotate(-4deg)`,
      padding: big ? '14px 34px' : '10px 26px',
      borderRadius: 999,
      background: big ? colors.yellow : '#fff',
      color: colors.dark,
      border: '5px solid #111',
      fontFamily: rounded,
      fontWeight: 800,
      fontSize: big ? 72 : 46,
      whiteSpace: 'nowrap',
      boxShadow: '0 8px 0 rgba(0,0,0,0.25)',
    }}
  >
    {text}
  </div>
);

const AnnotationView: React.FC<{a: Annotation; orbit: number}> = ({a, orbit}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const draw = interpolate(frame, [a.at, a.at + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pop = spring({frame: frame - a.at - 8, fps, config: {damping: 10, stiffness: 220}});
  if (a.kind === 'measure') {
    const p1 = track(a.x, a.top, a.dTop, orbit, frame);
    const p2 = track(a.x, a.bottom, a.dBottom, orbit, frame);
    const yTop = p2.y + (p1.y - p2.y) * draw; // le trait monte depuis le sol
    const tick = 34;
    return (
      <>
        <svg width={CW} height={CH} style={{position: 'absolute', inset: 0}}>
          {[outline(10), ink(10)].map((st, i) => (
            <g key={i} {...st}>
              <line x1={p2.x} y1={p2.y} x2={p2.x + (p1.x - p2.x) * draw} y2={yTop} />
              <line x1={p2.x - tick} y1={p2.y} x2={p2.x + tick} y2={p2.y} />
              {draw > 0.98 && <line x1={p1.x - tick} y1={p1.y} x2={p1.x + tick} y2={p1.y} />}
            </g>
          ))}
        </svg>
        <Label x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2} text={a.label} pop={pop} big />
      </>
    );
  }
  const f = track(a.from[0], a.from[1], a.dFrom, orbit, frame);
  const t = track(a.to[0], a.to[1], a.dTo, orbit, frame);
  // courbe « dessinée à la main » + pointe de flèche
  const mx = (f.x + t.x) / 2 + (t.y - f.y) * 0.25;
  const my = (f.y + t.y) / 2 - (t.x - f.x) * 0.25;
  const path = `M ${f.x} ${f.y} Q ${mx} ${my} ${t.x} ${t.y}`;
  const len = Math.hypot(t.x - f.x, t.y - f.y) * 1.25;
  const ang = Math.atan2(t.y - my, t.x - mx);
  const head = 36;
  const hx1 = t.x - head * Math.cos(ang - 0.5);
  const hy1 = t.y - head * Math.sin(ang - 0.5);
  const hx2 = t.x - head * Math.cos(ang + 0.5);
  const hy2 = t.y - head * Math.sin(ang + 0.5);
  return (
    <>
      <svg width={CW} height={CH} style={{position: 'absolute', inset: 0}}>
        {[outline(9), ink(9)].map((st, i) => (
          <g key={i} {...st}>
            <path d={path} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
            {draw > 0.95 && <path d={`M ${hx1} ${hy1} L ${t.x} ${t.y} L ${hx2} ${hy2}`} />}
          </g>
        ))}
      </svg>
      <Label x={f.x} y={f.y} text={a.label} pop={pop} />
    </>
  );
};

// Clip « photo 3D » plein écran (hors zone de sécurité), avec ses annotations collées à la scène.
// Le clip 1080×1920 est cadré « cover » quel que soit le format (9:16, 4:5…), avec un « punch » d'entrée.
export const Clip3D: React.FC<{clip: string; orbit: number; annotations?: Annotation[]}> = ({clip, orbit, annotations = []}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const k = Math.max(width / CW, height / CH);
  const punch = interpolate(spring({frame, fps, config: {damping: 16, stiffness: 240}}), [0, 1], [1.18, 1]);
  return (
    <div style={{position: 'fixed', inset: 0, overflow: 'hidden', background: '#000'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${punch})`}}>
        <div
          style={{
            position: 'absolute',
            width: CW,
            height: CH,
            left: (width - CW * k) / 2,
            top: (height - CH * k) / 2,
            transform: `scale(${k})`,
            transformOrigin: '0 0',
          }}
        >
          <OffthreadVideo src={staticFile(`funny/clips/${clip}.mp4`)} muted style={{width: CW, height: CH}} />
          {/* assombrit le haut et le bas pour la lisibilité des textes */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.5) 100%)'}} />
          {annotations.map((a, i) => (
            <AnnotationView key={i} a={a} orbit={orbit} />
          ))}
        </div>
      </div>
    </div>
  );
};
