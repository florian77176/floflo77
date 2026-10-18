import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rounded} from '../fonts';
import {useUnit} from '../components/ui';
import {funny, funnyMusic} from './config';

const {colors} = funny;
export const FBEAT = funnyMusic.beatSec * 30;
const CONFETTI = [colors.red, colors.orange, colors.blue, colors.green, colors.white, '#B04BFF'];

export const usePopAt = (at: number, stiffness = 200, damping = 11) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at), fps, config: {damping, stiffness}});
};

// Fond jaune « fête foraine » : rayons qui tournent, halo qui pulse sur le rythme, confettis qui tombent
export const FunnyBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const pulse = Math.exp(-(frame % FBEAT) / 5);
  const angle = frame * 0.25;
  const pieces = new Array(46).fill(0).map((_, i) => {
    const x = random(`cx${i}`) * width + Math.sin(frame / 20 + i) * 20 * u;
    const y = ((random(`cy${i}`) * height + frame * (2 + random(`cv${i}`) * 3) * u) % (height + 60)) - 30;
    return {x, y, w: (10 + random(`cw${i}`) * 14) * u, h: (6 + random(`ch${i}`) * 8) * u, r: frame * (3 + random(`cr${i}`) * 6) + i * 40, c: CONFETTI[i % CONFETTI.length]};
  });
  return (
    <AbsoluteFill style={{background: colors.yellow, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${angle}deg at 50% 42%, ${colors.yellow} 0deg 9deg, ${colors.yellowLight} 9deg 18deg)`,
          opacity: 0.85,
        }}
      />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, rgba(255,255,255,${0.35 + pulse * 0.25}) 0%, transparent ${42 + pulse * 6}%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 55%, ${colors.orange}88 100%)`}} />
      {pieces.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h, background: p.c, borderRadius: 2, transform: `rotate(${p.r}deg)`, opacity: 0.85}} />
      ))}
    </AbsoluteFill>
  );
};

// Explosion de confettis à partir du centre d'un élément
export const ConfettiBurst: React.FC<{at: number; count?: number; spread?: number}> = ({at, count = 36, spread = 1}) => {
  const frame = useCurrentFrame();
  const {unit} = useUnit();
  const tt = frame - at;
  if (tt < 0 || tt > 45) return null;
  return (
    <div style={{position: 'absolute', left: '50%', top: '45%', width: 0, height: 0, pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`ba${i}`) * Math.PI * 2;
        const v = (14 + random(`bv${i}`) * 18) * unit * spread;
        const x = Math.cos(a) * v * tt * 0.9;
        const y = Math.sin(a) * v * tt * 0.9 - 0 + 0.9 * tt * tt * unit;
        const op = interpolate(tt, [30, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: (12 + random(`bw${i}`) * 10) * unit,
              height: (7 + random(`bh${i}`) * 6) * unit,
              background: CONFETTI[i % CONFETTI.length],
              borderRadius: 2,
              transform: `rotate(${tt * 20 + i * 30}deg)`,
              opacity: op,
            }}
          />
        );
      })}
    </div>
  );
};

// Structure détourée façon « sticker » (contour blanc) qui se GONFLE puis rebondit sur le rythme.
// deflateAt : image où elle se dégonfle (sortie de scène).
export const InflatableSticker: React.FC<{src: string; ratio: number; maxW: number; maxH: number; at?: number; deflateAt?: number}> = ({
  src,
  ratio,
  maxW,
  maxH,
  at = 0,
  deflateAt,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const w = Math.min(maxW, maxH * ratio) * unit;
  const h = w / ratio;
  const t = frame - at;
  // gonflage : la hauteur monte avec un dépassement élastique, la largeur suit
  const grow = spring({frame: t, fps, config: {damping: 7, stiffness: 90, mass: 0.8}});
  const sy = interpolate(grow, [0, 1], [0.05, 1]);
  const sx = interpolate(grow, [0, 1], [0.55, 1]);
  const wobble = Math.sin(t / 2.2) * 4 * Math.exp(-t / 14);
  const bob = 1 + 0.015 * Math.exp(-(frame % FBEAT) / 4);
  const deflate = deflateAt === undefined ? 0 : interpolate(frame, [deflateAt, deflateAt + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = 7 * unit; // épaisseur du contour blanc
  return (
    <div
      style={{
        width: w,
        height: h,
        transformOrigin: '50% 100%',
        transform: `scale(${sx * (1 + deflate * 0.25)}, ${sy * bob * (1 - deflate * 0.85)}) rotate(${wobble}deg)`,
        opacity: t < 0 ? 0 : 1 - deflate,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: `drop-shadow(${o}px 0 0 #fff) drop-shadow(-${o}px 0 0 #fff) drop-shadow(0 ${o}px 0 #fff) drop-shadow(0 -${o}px 0 #fff) drop-shadow(0 ${18 * unit}px ${22 * unit}px rgba(0,0,0,0.28))`,
        }}
      />
    </div>
  );
};

// Texte gras arrondi avec contour blanc (lisible sur le jaune)
export const BigText: React.FC<{children: React.ReactNode; size: number; color?: string; at?: number; rotate?: number}> = ({
  children,
  size,
  color = colors.dark,
  at,
  rotate = 0,
}) => {
  const {unit} = useUnit();
  const pop = usePopAt(at ?? -1000);
  const s = at === undefined ? 1 : pop;
  const st = 5 * unit;
  return (
    <div
      style={{
        fontFamily: rounded,
        fontWeight: 800,
        fontSize: size * unit,
        lineHeight: 1.02,
        color,
        textAlign: 'center',
        transform: `scale(${s}) rotate(${rotate}deg)`,
        textShadow: `${st}px 0 #fff, -${st}px 0 #fff, 0 ${st}px #fff, 0 -${st}px #fff, ${st * 0.7}px ${st * 0.7}px #fff, -${st * 0.7}px ${st * 0.7}px #fff, ${st * 0.7}px -${st * 0.7}px #fff, -${st * 0.7}px -${st * 0.7}px #fff, 0 ${st * 2}px 0 rgba(0,0,0,0.15)`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{children: React.ReactNode; size: number; bg?: string; color?: string; at?: number; rotate?: number}> = ({
  children,
  size,
  bg = colors.red,
  color = colors.white,
  at,
  rotate = 0,
}) => {
  const {unit} = useUnit();
  const pop = usePopAt(at ?? -1000, 220);
  const s = at === undefined ? 1 : pop;
  return (
    <div
      style={{
        transform: `scale(${s}) rotate(${rotate}deg)`,
        padding: `${size * 0.28 * unit}px ${size * 0.75 * unit}px`,
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: rounded,
        fontWeight: 800,
        fontSize: size * unit,
        lineHeight: 1.1,
        border: `${4 * unit}px solid #fff`,
        boxShadow: `0 ${8 * unit}px 0 rgba(0,0,0,0.18)`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

export const NumBadge: React.FC<{n: number; size: number; at?: number}> = ({n, size, at = 0}) => {
  const {unit} = useUnit();
  const s = usePopAt(at, 240);
  return (
    <div
      style={{
        width: size * unit,
        height: size * unit,
        borderRadius: '50%',
        background: colors.red,
        border: `${5 * unit}px solid #fff`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: rounded,
        fontWeight: 800,
        fontSize: size * 0.62 * unit,
        transform: `scale(${s}) rotate(${(1 - s) * -60}deg)`,
        boxShadow: `0 ${6 * unit}px 0 rgba(0,0,0,0.18)`,
        flexShrink: 0,
        paddingTop: size * 0.06 * unit,
        boxSizing: 'border-box',
      }}
    >
      {n}
    </div>
  );
};

// Étiquette « Nouveau » / « Best-seller » en étoile
export const StarBadge: React.FC<{text: string; size: number; at: number}> = ({text, size, at}) => {
  const frame = useCurrentFrame();
  const {unit} = useUnit();
  const s = usePopAt(at, 200, 9);
  const spin = Math.sin(frame / 8) * 4;
  const pts = new Array(24)
    .fill(0)
    .map((_, i) => {
      const r = i % 2 ? 42 : 50;
      const a = (i / 24) * Math.PI * 2;
      return `${50 + r * Math.cos(a)}% ${50 + r * Math.sin(a)}%`;
    })
    .join(', ');
  return (
    <div style={{width: size * unit, height: size * unit, position: 'relative', transform: `scale(${s}) rotate(${12 + spin}deg)`}}>
      <div style={{position: 'absolute', inset: 0, background: colors.red, clipPath: `polygon(${pts})`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: rounded,
          fontWeight: 800,
          color: '#fff',
          fontSize: size * 0.17 * unit,
          lineHeight: 1,
          textTransform: 'uppercase',
          padding: size * 0.12 * unit,
        }}
      >
        {text}
      </div>
    </div>
  );
};
