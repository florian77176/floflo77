import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';

const {colors} = brand;

// Fond animé : dégradé qui respire + bokeh lumineux + fines particules dorées
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 1080;

  const angle = interpolate(frame, [0, 600], [120, 220]);
  const glowX = 50 + Math.sin(frame / 70) * 20;
  const glowY = 40 + Math.cos(frame / 90) * 15;

  const bokeh = new Array(14).fill(0).map((_, i) => {
    const size = (120 + random(`s${i}`) * 260) * unit;
    const x = random(`x${i}`) * width;
    const baseY = random(`y${i}`) * height;
    const y = (baseY - frame * (0.4 + random(`v${i}`) * 0.8) * unit + height * 2) % (height + size) - size / 2;
    const color = i % 3 === 0 ? colors.accent : colors.primary;
    const opacity = 0.08 + random(`o${i}`) * 0.14;
    return {size, x, y, color, opacity};
  });

  const sparks = new Array(60).fill(0).map((_, i) => {
    const x = random(`px${i}`) * width + Math.sin(frame / 30 + i) * 8 * unit;
    const y = (random(`py${i}`) * height - frame * (1 + random(`pv${i}`) * 2) * unit + height * 4) % height;
    const s = (2 + random(`ps${i}`) * 4) * unit;
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame / 10 + i));
    return {x, y, s, twinkle};
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colors.background} 0%, ${colors.backgroundAlt} 55%, ${colors.background} 100%)`,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${colors.accent}33 0%, transparent 45%)`,
        }}
      />
      {bokeh.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x - b.size / 2,
            top: b.y,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.color,
            opacity: b.opacity,
            filter: `blur(${40 * unit}px)`,
          }}
        />
      ))}
      {sparks.map((p, i) => (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.s,
            height: p.s,
            borderRadius: '50%',
            background: colors.primary,
            opacity: p.twinkle * 0.8,
            boxShadow: `0 0 ${p.s * 3}px ${colors.primary}`,
          }}
        />
      ))}
      {/* vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};
