import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Lottie, LottieAnimationData} from '@remotion/lottie';
import {useUnit} from '../components/ui';

// ─── Éléments « vivants » : emoji 3D animés (Noto Animated Emoji, Google, CC BY 4.0), titres en relief,
// étiquettes qui pivotent en 3D, confettis en profondeur, balayages de lumière. ─────────────────────────

const cache = new Map<string, LottieAnimationData>();

// Emoji animé 3D (fichiers public/lottie/<nom>.json)
export const AnimatedEmoji: React.FC<{name: string; size: number}> = ({name, size}) => {
  const [data, setData] = useState<LottieAnimationData | null>(() => cache.get(name) ?? null);
  const [handle] = useState(() => (cache.has(name) ? null : delayRender(`emoji ${name}`)));
  useEffect(() => {
    if (data) return;
    fetch(staticFile(`lottie/${name}.json`))
      .then((r) => r.json())
      .then((j) => {
        cache.set(name, j);
        setData(j);
        if (handle !== null) continueRender(handle);
      });
  }, [name, data, handle]);
  if (!data) return null;
  return <Lottie animationData={data} loop style={{width: size, height: size}} />;
};

export type Floater = {
  emoji: string; // nom du fichier dans public/lottie
  x: number; // position en fraction de la zone visible (0..1)
  y: number;
  size?: number; // en unités (référence 1080)
  at?: number; // apparition (secondes depuis le début du plan)
  depth?: number; // 0 = loin (petit, lent) … 1 = proche (gros, rapide)
};

// Emoji qui « pop » (ressort), flotte, oscille et dérive selon sa profondeur (parallaxe)
export const FloatingEmoji: React.FC<{f: Floater; idx: number}> = ({f, idx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const at = Math.round((f.at ?? 0) * fps);
  const t = frame - at; // at < 0 : déjà affiché dès la 1re image
  if (t < 0) return null;
  const depth = f.depth ?? 0.6;
  const pop = spring({frame: t, fps, config: {damping: 9, stiffness: 180, mass: 0.7}});
  const size = (f.size ?? 150) * unit * (0.7 + depth * 0.5);
  const bob = Math.sin(t / (11 - depth * 4) + idx * 1.7) * 14 * unit * (0.5 + depth);
  const drift = t * (0.4 + depth * 0.8) * unit * (idx % 2 ? -1 : 1);
  const tilt = Math.sin(t / 13 + idx) * 10;
  const tiltY = Math.sin(t / 17 + idx * 2) * 25;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${f.x * 100}%`,
        top: `${f.y * 100}%`,
        transform: `translate(-50%, -50%) translate(${drift}px, ${bob}px) perspective(600px) rotateY(${tiltY}deg) rotate(${tilt}deg) scale(${pop})`,
        filter: `drop-shadow(0 ${14 * unit}px ${18 * unit}px rgba(0,0,0,${0.25 + depth * 0.2}))`,
        zIndex: Math.round(depth * 10),
      }}
    >
      <AnimatedEmoji name={f.emoji} size={size} />
    </div>
  );
};

// Titre en relief 3D (extrusion + contour) qui respire et pivote légèrement
export const Title3D: React.FC<{children: React.ReactNode; size: number; color?: string; at?: number; maxWidth?: number; font: string}> = ({
  children,
  size,
  color = '#fff',
  at = 0,
  maxWidth,
  font,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const t = frame - at;
  const pop = spring({frame: t, fps, config: {damping: 11, stiffness: 220}});
  const rx = Math.sin(frame / 20) * 7;
  const ry = Math.sin(frame / 27) * 9;
  const px = size * unit;
  const ext = Math.max(4, px * 0.07); // profondeur de l'extrusion
  const outline = Math.max(3, px * 0.05);
  const ring = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `${(Math.cos((a * Math.PI) / 180) * outline).toFixed(1)}px ${(Math.sin((a * Math.PI) / 180) * outline).toFixed(1)}px 0 #111`)
    .join(', ');
  const depth = new Array(8)
    .fill(0)
    .map((_, i) => `${((i + 1) * ext) / 8}px ${((i + 1) * ext) / 8 + outline}px 0 #111`)
    .join(', ');
  return (
    <div style={{perspective: 900 * unit}}>
      <div
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: px,
          lineHeight: 1.05,
          color,
          textAlign: 'center',
          maxWidth: maxWidth ? maxWidth * unit : undefined,
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${t < 0 ? 0 : pop})`,
          textShadow: `${ring}, ${depth}, 0 ${ext * 2.5}px ${ext * 3}px rgba(0,0,0,0.45)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Étiquette qui arrive en pivotant (flip 3D)
export const Flip3D: React.FC<{children: React.ReactNode; at?: number; from?: 'left' | 'right'}> = ({children, at = 0, from = 'left'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 160}});
  const ry = (1 - p) * (from === 'left' ? -95 : 95);
  return (
    <div style={{perspective: 700}}>
      <div style={{transform: `rotateY(${ry}deg) translateZ(${(1 - p) * 60}px)`, transformOrigin: from === 'left' ? 'left center' : 'right center', opacity: p > 0.05 ? 1 : 0}}>
        {children}
      </div>
    </div>
  );
};

const COLORS = ['#FE3030', '#FCDB5D', '#FDAF00', '#2F7BFF', '#2DBE60', '#ffffff', '#B04BFF'];

// Explosion de confettis en profondeur (rotation 3D, taille selon la distance)
export const Confetti3D: React.FC<{at?: number; count?: number}> = ({at = 0, count = 70}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame - at;
  if (t < 0 || t > 55) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', perspective: 800}}>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`ca${i}`) * Math.PI * 2;
        const z = random(`cz${i}`); // 0 loin … 1 proche
        const v = (10 + random(`cv${i}`) * 22) * (0.6 + z);
        const x = width / 2 + Math.cos(a) * v * t;
        const y = height * 0.42 + Math.sin(a) * v * t * 0.8 + 0.55 * t * t;
        const s = (14 + z * 26) * (width / 1080);
        const op = interpolate(t, [38, 55], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s * 0.55,
              background: COLORS[i % COLORS.length],
              borderRadius: 3,
              opacity: op,
              transform: `rotateX(${t * (8 + i % 7) * 3}deg) rotateY(${t * (5 + (i % 5)) * 3}deg) rotateZ(${i * 37}deg)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Balayage de lumière diagonal (reflet) sur toute l'image
export const LightSweep: React.FC<{at?: number; dur?: number}> = ({at = 0, dur = 18}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, dur], [-40, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at || frame > at + dur) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        background: `linear-gradient(115deg, transparent ${p - 18}%, rgba(255,240,200,0.35) ${p - 4}%, rgba(255,255,255,0.55) ${p}%, rgba(255,240,200,0.35) ${p + 4}%, transparent ${p + 18}%)`,
      }}
    />
  );
};
