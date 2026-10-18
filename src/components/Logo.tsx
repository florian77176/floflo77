import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';

const {colors} = brand;

// Logo animé : lettres qui tombent une à une + reflet lumineux
export const Logo: React.FC<{size?: number; delay?: number; showTagline?: boolean}> = ({
  size = 140,
  delay = 0,
  showTagline = true,
}) => {
  const frame = useCurrentFrame() - delay;
  const {fps, width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 1080;
  const fontSize = size * unit;

  if (brand.logo) {
    const s = spring({frame, fps, config: {damping: 12}});
    return (
      <Img
        src={staticFile(brand.logo)}
        style={{width: fontSize * 4, transform: `scale(${s})`, opacity: s}}
      />
    );
  }

  const [first, second] = splitName(brand.name);
  const letters = [...first.split('').map((c) => ({c, hl: false})), ...second.split('').map((c) => ({c, hl: true}))];

  const shine = interpolate(frame, [letters.length * 3 + 10, letters.length * 3 + 40], [-30, 130], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineIn = spring({frame: frame - letters.length * 3 - 10, fps, config: {damping: 200}});

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div
        style={{
          display: 'flex',
          fontFamily: sans,
          fontWeight: 900,
          fontSize,
          letterSpacing: -fontSize * 0.02,
          lineHeight: 1,
          // marge interne pour que le halo lumineux ne soit pas coupé par le masque
          padding: fontSize * 0.5,
          margin: -fontSize * 0.5,
          WebkitMaskImage: `linear-gradient(100deg, #000 ${shine - 20}%, rgba(0,0,0,0.55) ${shine}%, #000 ${shine + 20}%)`,
        }}
      >
        {letters.map((l, i) => {
          const s = spring({frame: frame - i * 3, fps, config: {damping: 11, stiffness: 140}});
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: l.hl ? colors.primary : colors.text,
                transform: `translateY(${(1 - s) * -fontSize * 0.8}px) rotate(${(1 - s) * -15}deg)`,
                opacity: Math.min(1, s * 1.5),
                textShadow: l.hl ? `0 0 ${fontSize * 0.3}px ${colors.primary}88` : 'none',
              }}
            >
              {l.c}
            </span>
          );
        })}
      </div>
      {showTagline && (
        <div
          style={{
            marginTop: fontSize * 0.6,
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: fontSize * 0.32,
            color: colors.muted,
            opacity: taglineIn,
            transform: `translateY(${(1 - taglineIn) * 20}px)`,
          }}
        >
          {brand.tagline}
        </div>
      )}
    </div>
  );
};

// "PhoEvents" -> ["Pho", "Events"] : la 2e partie est mise en couleur
function splitName(name: string): [string, string] {
  const idx = name.slice(1).search(/[A-Z]/);
  if (idx === -1) return [name, ''];
  return [name.slice(0, idx + 1), name.slice(idx + 1)];
}
