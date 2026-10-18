import React from 'react';
import {Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, promo} from '../config';
import {sans, serif} from '../fonts';
import {Template} from './Template';
import {Flash, goldGradient, Kicker, Logo, Reveal, Title, useUnit} from './ui';

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

// 2. Les fonds IA : compte à rebours 3-2-1, flash, puis le décor apparaît
export const THEME_DURATION = 60;
export const ThemesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const w = vertical ? 820 : 900;
  return (
    <Stack gap={vertical ? 60 : 30}>
      <Reveal>
        <Kicker>✦ {promo.themesTitle} ✦</Kicker>
      </Reveal>
      <div style={{position: 'relative', width: w * unit, height: ((w * 2) / 3) * unit + 140 * unit}}>
        {promo.themes.map((t, i) => {
          const from = i * THEME_DURATION;
          const local = frame - from;
          const count = local < 24 ? 3 - Math.floor(local / 8) : 0;
          const countScale = 1.6 - (local % 8) / 10;
          const shown = local >= 24;
          const zoom = interpolate(local, [24, THEME_DURATION + 20], [1.15, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const labelIn = spring({frame: local - 30, fps, config: {damping: 200}});
          return (
            <Sequence key={t.label} from={from} durationInFrames={i === promo.themes.length - 1 ? Infinity : THEME_DURATION} layout="none">
              <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 * unit}}>
                <div
                  style={{
                    width: w * unit,
                    height: ((w * 2) / 3) * unit,
                    borderRadius: 16 * unit,
                    overflow: 'hidden',
                    position: 'relative',
                    border: `${4 * unit}px solid ${colors.gold}`,
                    boxShadow: `0 ${30 * unit}px ${80 * unit}px rgba(0,0,0,0.6), 0 0 ${60 * unit}px ${colors.gold}44`,
                    background: '#000',
                  }}
                >
                  {shown && (
                    <Img src={staticFile(t.decor)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
                  )}
                  {count > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: sans,
                        fontWeight: 900,
                        fontSize: 260 * unit,
                        color: colors.cream,
                        transform: `scale(${countScale})`,
                        opacity: 1 - (local % 8) / 10,
                      }}
                    >
                      {count}
                    </div>
                  )}
                  <Flash at={24} />
                </div>
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
            </Sequence>
          );
        })}
      </div>
    </Stack>
  );
};

// 3. Cadres personnalisés : un exemple par type d'événement
export const TEMPLATE_DURATION = 55;
export const TemplatesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const w = vertical ? 820 : 760;
  return (
    <Stack gap={vertical ? 50 : 26}>
      <Reveal>
        <Kicker>✦ {promo.templatesTitle} ✦</Kicker>
      </Reveal>
      <div style={{position: 'relative', width: w * unit, height: ((w * 2) / 3) * unit + 150 * unit}}>
        {promo.templates.map((t, i) => {
          const from = i * TEMPLATE_DURATION;
          const local = frame - from;
          const inS = spring({frame: local, fps, config: {damping: 14, stiffness: 120}});
          const chipIn = spring({frame: local - 4, fps, config: {damping: 200}});
          return (
            <Sequence key={t.event} from={from} durationInFrames={i === promo.templates.length - 1 ? Infinity : TEMPLATE_DURATION} layout="none">
              <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 * unit}}>
                <div
                  style={{
                    padding: `${12 * unit}px ${36 * unit}px`,
                    borderRadius: 999,
                    background: goldGradient,
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 34 * unit,
                    color: colors.background,
                    textTransform: 'uppercase',
                    letterSpacing: 3 * unit,
                    opacity: chipIn,
                    transform: `translateY(${(1 - chipIn) * -20}px)`,
                  }}
                >
                  {t.event}
                </div>
                <div style={{transform: `translateX(${(1 - inS) * 120}%) rotate(${(1 - inS) * 8 + (i % 2 ? 1.5 : -1.5)}deg)`}}>
                  <Template style={t.style as any} title={t.title} subtitle={t.subtitle} decor={t.decor} width={w} typeFrom={10} />
                </div>
              </div>
            </Sequence>
          );
        })}
      </div>
    </Stack>
  );
};

// 4. Le tirage sort de l'imprimante
export const PrintScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const w = vertical ? 700 : 560;
  const h = (w * 2) / 3;
  const out = interpolate(frame, [8, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const t = promo.templates[0];
  return (
    <Stack gap={vertical ? 60 : 30}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {/* fente de l'imprimante */}
        <div
          style={{
            width: (w + 80) * unit,
            height: 70 * unit,
            borderRadius: 18 * unit,
            background: `linear-gradient(180deg, #3a362f, #1d1b17)`,
            border: `${2 * unit}px solid ${colors.gold}66`,
            position: 'relative',
            zIndex: 2,
            boxShadow: `0 ${10 * unit}px ${30 * unit}px rgba(0,0,0,0.6)`,
          }}
        >
          <div style={{position: 'absolute', left: 40 * unit, right: 40 * unit, bottom: 16 * unit, height: 8 * unit, borderRadius: 4, background: '#000'}} />
        </div>
        <div style={{height: (h + 40) * unit, overflow: 'hidden', marginTop: -24 * unit, paddingLeft: 30 * unit, paddingRight: 30 * unit}}>
          <div style={{transform: `translateY(${(out - 1) * 100}%)`, paddingTop: 10 * unit}}>
            <Template style={t.style as any} title={t.title} subtitle={t.subtitle} decor={t.decor} width={w} typeFrom={-100} />
          </div>
        </div>
      </div>
      <Reveal delay={40}>
        <Title size={vertical ? 84 : 70} italic gold>
          {promo.prints.title}
        </Title>
      </Reveal>
      <Reveal delay={46}>
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: (vertical ? 38 : 32) * unit, color: colors.muted, textAlign: 'center', maxWidth: (vertical ? 760 : 860) * unit}}>
          {promo.prints.subtitle}
        </div>
      </Reveal>
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
