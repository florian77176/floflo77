import React from 'react';
import {interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, promo} from '../config';
import {sans, serif} from '../fonts';
import {Flash, goldGradient, Kicker, Logo, PrintPhoto, Reveal, Title, useUnit} from './ui';

const {colors} = brand;

const Stack: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 40}) => {
  const {unit} = useUnit();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap * unit, padding: `0 ${60 * unit}px`}}>
      {children}
    </div>
  );
};

// 1. Accroche
export const HookScene: React.FC = () => {
  const {vertical} = useUnit();
  return (
    <Stack gap={10}>
      <Reveal>
        <Title size={vertical ? 92 : 80}>{promo.hook[0]}</Title>
      </Reveal>
      {promo.hook.slice(1).map((line, i) => (
        <Reveal key={line} delay={8 + i * 6}>
          <Title size={vertical ? 120 : 100} italic gold>
            {line}
          </Title>
        </Reveal>
      ))}
    </Stack>
  );
};

// 2. Les fonds IA : une photo par thème, avec flash à chaque changement
export const THEME_DURATION = 55;
export const ThemesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  return (
    <Stack gap={vertical ? 60 : 30}>
      <Reveal>
        <Kicker>✦ {promo.themesTitle} ✦</Kicker>
      </Reveal>
      <div style={{position: 'relative', width: '100%', height: (vertical ? 1000 : 640) * unit}}>
        {promo.themes.map((t, i) => {
          const from = i * THEME_DURATION;
          const portrait = t.photo.includes('film-noir');
          const w = portrait ? (vertical ? 540 : 380) : vertical ? 800 : 760;
          const labelIn = spring({frame: frame - from - 10, fps, config: {damping: 200}});
          return (
            <Sequence key={t.label} from={from} durationInFrames={i === promo.themes.length - 1 ? Infinity : THEME_DURATION} layout="none">
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 40 * unit,
                }}
              >
                <PrintPhoto src={t.photo} width={w} rotate={i % 2 ? 3 : -3} />
                <div
                  style={{
                    opacity: labelIn,
                    transform: `translateY(${(1 - labelIn) * 30}px)`,
                    fontFamily: serif,
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: (vertical ? 72 : 58) * unit,
                    color: colors.cream,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.emoji} {t.label}
                </div>
              </div>
              <Flash />
            </Sequence>
          );
        })}
      </div>
    </Stack>
  );
};

// 3 & 4. Photo + titre + sous-titre (impressions, cadre personnalisé)
export const FeatureScene: React.FC<{photo: string; title: string; subtitle: string; rotate?: number}> = ({
  photo,
  title,
  subtitle,
  rotate = 2,
}) => {
  const {unit, vertical} = useUnit();
  const portrait = photo.includes('tirages');
  const w = portrait ? (vertical ? 560 : 380) : vertical ? 800 : 640;
  return (
    <Stack gap={vertical ? 60 : 36}>
      <PrintPhoto src={photo} width={w} rotate={rotate} />
      <Reveal delay={12}>
        <Title size={vertical ? 84 : 70} italic gold>
          {title}
        </Title>
      </Reveal>
      <Reveal delay={18}>
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: (vertical ? 38 : 32) * unit, color: colors.muted, textAlign: 'center', maxWidth: (vertical ? 760 : 860) * unit}}>
          {subtitle}
        </div>
      </Reveal>
      <Flash />
    </Stack>
  );
};

// 5. Avis clients
export const ReviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  return (
    <Stack gap={vertical ? 50 : 34}>
      <div style={{display: 'flex', gap: 14 * unit}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const s = spring({frame: frame - i * 5, fps, config: {damping: 9, stiffness: 160}});
          return (
            <div key={i} style={{fontSize: 100 * unit, color: colors.gold, transform: `scale(${s}) rotate(${(1 - s) * 90}deg)`, textShadow: `0 0 ${30 * unit}px ${colors.gold}`}}>
              ★
            </div>
          );
        })}
      </div>
      <Reveal delay={20}>
        <div style={{textAlign: 'center'}}>
          <span style={{fontFamily: sans, fontWeight: 800, fontSize: 80 * unit, color: colors.cream}}>{promo.review.score}</span>
          <span style={{fontFamily: sans, fontWeight: 500, fontSize: 40 * unit, color: colors.muted}}> {promo.review.source}</span>
        </div>
      </Reveal>
      <Reveal delay={30}>
        <div
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: (vertical ? 62 : 52) * unit,
            lineHeight: 1.25,
            color: colors.cream,
            textAlign: 'center',
            maxWidth: (vertical ? 780 : 900) * unit,
          }}
        >
          « {promo.review.quote} »
        </div>
      </Reveal>
      <Reveal delay={38}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 32 * unit, color: colors.gold, letterSpacing: 4 * unit}}>— {promo.review.author}</div>
      </Reveal>
    </Stack>
  );
};

// 6. Pour quels événements + prix
export const OfferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const priceIn = spring({frame: frame - 30, fps, config: {damping: 11}});
  return (
    <Stack gap={vertical ? 60 : 40}>
      <Reveal>
        <Kicker>Pour tous vos événements</Kicker>
      </Reveal>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22 * unit, maxWidth: (vertical ? 780 : 920) * unit}}>
        {promo.events.map((e, i) => {
          const s = spring({frame: frame - 6 - i * 4, fps, config: {damping: 14}});
          return (
            <div
              key={e}
              style={{
                transform: `scale(${s})`,
                padding: `${18 * unit}px ${36 * unit}px`,
                borderRadius: 999,
                border: `${2 * unit}px solid ${colors.gold}`,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: (vertical ? 38 : 32) * unit,
                color: colors.cream,
                background: 'rgba(212,175,55,0.08)',
              }}
            >
              {e}
            </div>
          );
        })}
      </div>
      <div style={{transform: `scale(${priceIn})`, textAlign: 'center'}}>
        <Title size={vertical ? 120 : 100} italic gold>
          {promo.price}
        </Title>
      </div>
      <Reveal delay={40}>
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: 34 * unit, color: colors.muted, textAlign: 'center'}}>📍 {brand.zone}</div>
      </Reveal>
    </Stack>
  );
};

// 7. Appel à l'action final
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const btn = spring({frame: frame - 20, fps, config: {damping: 10, stiffness: 120}});
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  const shine = interpolate(frame % 60, [0, 40], [-30, 130]);
  return (
    <Stack gap={vertical ? 56 : 34}>
      <Logo size={vertical ? 400 : 300} />
      <div
        style={{
          transform: `scale(${btn * pulse})`,
          padding: `${30 * unit}px ${70 * unit}px`,
          borderRadius: 999,
          background: `linear-gradient(110deg, transparent ${shine - 10}%, rgba(255,255,255,0.5) ${shine}%, transparent ${shine + 10}%), ${goldGradient}`,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: (vertical ? 42 : 44) * unit,
          whiteSpace: 'nowrap',
          color: colors.background,
          textTransform: 'uppercase',
          letterSpacing: 2 * unit,
          boxShadow: `0 0 ${70 * unit}px ${colors.gold}77`,
        }}
      >
        {promo.cta}
      </div>
      <Reveal delay={30}>
        <div style={{fontFamily: sans, fontWeight: 800, fontSize: (vertical ? 64 : 54) * unit, color: colors.cream, textAlign: 'center'}}>{brand.site}</div>
      </Reveal>
      <Reveal delay={36}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 40 * unit, color: colors.gold, textAlign: 'center'}}>📞 {brand.phone}</div>
      </Reveal>
      <Reveal delay={42}>
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: 32 * unit, color: colors.muted, textAlign: 'center'}}>{promo.ctaSub}</div>
      </Reveal>
    </Stack>
  );
};
