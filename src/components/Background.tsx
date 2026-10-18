import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';

const {colors} = brand;

// Fond noir chaud + halo doré qui se déplace + paillettes dorées qui montent
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 1080;

  const glowX = 50 + Math.sin(frame / 80) * 25;
  const glowY = 45 + Math.cos(frame / 100) * 20;

  const sparks = new Array(70).fill(0).map((_, i) => {
    const x = random(`px${i}`) * width + Math.sin(frame / 35 + i) * 10 * unit;
    const y = (random(`py${i}`) * height - frame * (0.6 + random(`pv${i}`) * 1.6) * unit + height * 4) % height;
    const s = (1.5 + random(`ps${i}`) * 4) * unit;
    const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(frame / 12 + i));
    return {x, y, s, twinkle};
  });

  return (
    <AbsoluteFill style={{background: colors.background, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${colors.gold}2A 0%, transparent 50%), radial-gradient(circle at ${100 - glowX}% ${100 - glowY}%, ${colors.backgroundAlt} 0%, transparent 60%)`,
        }}
      />
      {sparks.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.s,
            height: p.s,
            borderRadius: '50%',
            background: colors.goldLight,
            opacity: p.twinkle * 0.7,
            boxShadow: `0 0 ${p.s * 3}px ${colors.gold}`,
          }}
        />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};
