import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, event} from '../config';
import {sans, serif} from '../fonts';
import {Logo} from './Logo';

const {colors} = brand;

const useUnit = () => {
  const {width, height} = useVideoConfig();
  return {unit: Math.min(width, height) / 1080, vertical: height > width};
};

// Fondu d'entrée/sortie commun à chaque scène
export const SceneFade: React.FC<{children: React.ReactNode; duration: number}> = ({children, duration}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, duration], [1.04, 1]);
  return (
    <AbsoluteFill
      style={{opacity, transform: `scale(${scale})`, justifyContent: 'center', alignItems: 'center'}}
    >
      {children}
    </AbsoluteFill>
  );
};

export const IntroScene: React.FC = () => <Logo size={150} />;

// Titre révélé derrière un masque + ligne dorée
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const big = (vertical ? 150 : 130) * unit;

  const reveal = (d: number) => spring({frame: frame - d, fps, config: {damping: 200}, durationInFrames: 25});
  const line = spring({frame: frame - 30, fps, config: {damping: 200}});

  const Mask: React.FC<{children: React.ReactNode; d: number}> = ({children, d}) => (
    <div style={{overflow: 'hidden', padding: `0 ${20 * unit}px`}}>
      <div style={{transform: `translateY(${(1 - reveal(d)) * 110}%)`}}>{children}</div>
    </div>
  );

  return (
    <div style={{textAlign: 'center', fontFamily: sans, padding: 60 * unit}}>
      <Mask d={0}>
        <div
          style={{
            fontSize: 34 * unit,
            letterSpacing: 10 * unit,
            textTransform: 'uppercase',
            color: colors.primary,
            fontWeight: 600,
          }}
        >
          {event.kicker}
        </div>
      </Mask>
      <div
        style={{
          height: 4 * unit,
          width: 260 * unit * line,
          margin: `${30 * unit}px auto`,
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          borderRadius: 4,
        }}
      />
      <Mask d={6}>
        <div style={{fontSize: big, fontWeight: 900, color: colors.text, lineHeight: 1.05}}>{event.title}</div>
      </Mask>
      <Mask d={12}>
        <div
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: big * 0.95,
            lineHeight: 1.15,
            backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            paddingBottom: 20 * unit,
          }}
        >
          {event.titleHighlight}
        </div>
      </Mask>
      <Mask d={22}>
        <div style={{fontSize: 40 * unit, color: colors.muted, marginTop: 20 * unit, fontWeight: 600}}>
          {event.subtitle}
        </div>
      </Mask>
    </div>
  );
};

// Infos pratiques : cartes en verre qui glissent
export const InfoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const items = [
    {icon: '📅', label: 'Date', value: event.date},
    {icon: '🕗', label: 'Horaires', value: event.time},
    {icon: '📍', label: 'Lieu', value: event.place},
  ];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 36 * unit, width: '82%'}}>
      {items.map((it, i) => {
        const s = spring({frame: frame - i * 8, fps, config: {damping: 14}});
        return (
          <div
            key={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 36 * unit,
              padding: `${36 * unit}px ${44 * unit}px`,
              borderRadius: 32 * unit,
              background: 'rgba(255,255,255,0.07)',
              border: `${2 * unit}px solid rgba(255,255,255,0.15)`,
              boxShadow: `0 ${20 * unit}px ${60 * unit}px rgba(0,0,0,0.35)`,
              transform: `translateX(${(1 - s) * (i % 2 ? 1 : -1) * 120}%)`,
              opacity: s,
              fontFamily: sans,
            }}
          >
            <div
              style={{
                width: 110 * unit,
                height: 110 * unit,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 54 * unit,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                flexShrink: 0,
              }}
            >
              {it.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 28 * unit,
                  letterSpacing: 6 * unit,
                  textTransform: 'uppercase',
                  color: colors.primary,
                  fontWeight: 600,
                }}
              >
                {it.label}
              </div>
              <div style={{fontSize: 58 * unit, color: colors.text, fontWeight: 800}}>{it.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Appel à l'action + bouton pulsant + logo final
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const pop = spring({frame, fps, config: {damping: 10, stiffness: 120}});
  const pulse = 1 + Math.sin(frame / 6) * 0.03;
  const linkIn = spring({frame: frame - 15, fps, config: {damping: 200}});

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 70 * unit}}>
      <Logo size={110} delay={0} showTagline={false} />
      <div
        style={{
          transform: `scale(${pop * pulse})`,
          padding: `${34 * unit}px ${80 * unit}px`,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          fontFamily: sans,
          fontWeight: 900,
          fontSize: 56 * unit,
          color: colors.background,
          textTransform: 'uppercase',
          letterSpacing: 2 * unit,
          boxShadow: `0 0 ${80 * unit}px ${colors.accent}88`,
        }}
      >
        {event.cta}
      </div>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 44 * unit,
          color: colors.text,
          opacity: linkIn,
          transform: `translateY(${(1 - linkIn) * 30}px)`,
        }}
      >
        {event.link}
      </div>
    </div>
  );
};
