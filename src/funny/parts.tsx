import React from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
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
