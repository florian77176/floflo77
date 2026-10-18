import React from 'react';
import {Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, musicCredit, promo} from '../config';
import {sans, serif} from '../fonts';
import {LAYOUT_RATIO, Template, TemplateLayout, TemplateStyle} from './Template';
import {Flash, goldGradient, Kicker, Logo, Reveal, Title, useUnit} from './ui';

const {colors} = brand;

// Effet sonore déclenché à une image donnée de la scène
export const Sfx: React.FC<{name: string; at?: number; volume?: number}> = ({name, at = 0, volume = 0.8}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`audio/sfx-${name}.wav`)} volume={volume} />
  </Sequence>
);

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
    <Stack gap={6}>
      <Sfx name="whoosh" volume={0.5} />
      <Reveal>
        <Title size={vertical ? 92 : 80}>{promo.hook[0]}</Title>
      </Reveal>
      {promo.hook.slice(1).map((line, i) => (
        <Reveal key={line} delay={6 + i * 6}>
          <Title size={vertical ? 110 : 96} italic gold>
            {line}
          </Title>
        </Reveal>
      ))}
    </Stack>
  );
};

// 2. Compte à rebours du photobooth : 3, 2, 1… flash !
export const CountdownScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const step = 13;
  const count = 3 - Math.floor(frame / step);
  const local = frame % step;
  const smile = spring({frame: frame - 3 * step - 2, fps, config: {damping: 9, stiffness: 160}});
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="beep" at={i * step} volume={0.5} />
      ))}
      <Sfx name="shutter" at={3 * step} volume={1} />
      {count > 0 ? (
        <div
          style={{
            width: 360 * unit,
            height: 360 * unit,
            borderRadius: '50%',
            border: `${6 * unit}px solid ${colors.gold}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: sans,
            fontWeight: 900,
            fontSize: 220 * unit,
            color: colors.cream,
            transform: `scale(${1.25 - local / 40})`,
            boxShadow: `0 0 ${80 * unit}px ${colors.gold}66, inset 0 0 ${60 * unit}px ${colors.gold}33`,
          }}
        >
          {count}
        </div>
      ) : (
        <div style={{transform: `scale(${smile}) rotate(${(1 - smile) * -10}deg)`}}>
          <Title size={150} italic gold>
            {promo.smile}
          </Title>
        </div>
      )}
      <Flash at={3 * step} />
    </>
  );
};

// 3. Les cadres : un exemple par type d'événement, les photos se prennent une à une
export const TEMPLATE_DURATION = 62;
export const TemplatesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const maxW = vertical ? 800 : 760;
  const maxH = vertical ? 1000 : 640;
  return (
    <Stack gap={vertical ? 40 : 22}>
      <Reveal>
        <Kicker>✦ {promo.templatesTitle} ✦</Kicker>
      </Reveal>
      <div style={{position: 'relative', width: maxW * unit, height: maxH * unit + 110 * unit}}>
        {promo.templates.map((t, i) => {
          const from = i * TEMPLATE_DURATION;
          const local = frame - from;
          const inS = spring({frame: local, fps, config: {damping: 14, stiffness: 120}});
          const out = interpolate(local, [TEMPLATE_DURATION - 8, TEMPLATE_DURATION], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const last = i === promo.templates.length - 1;
          const layout = t.layout as TemplateLayout;
          const height = Math.min(maxH, maxW / LAYOUT_RATIO[layout]);
          const slots = {strip: 3, grid: 4, single: 1, duo: 2, logo: 1}[layout];
          return (
            <Sequence key={t.event} from={from} durationInFrames={last ? Infinity : TEMPLATE_DURATION} layout="none">
              <Sfx name="whoosh" volume={0.35} />
              {new Array(slots).fill(0).map((_, k) => (
                <Sfx key={k} name="shutter" at={14 + k * 7} volume={0.55} />
              ))}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 30 * unit,
                  opacity: last ? 1 : 1 - out,
                }}
              >
                <div
                  style={{
                    padding: `${12 * unit}px ${36 * unit}px`,
                    borderRadius: 999,
                    background: goldGradient,
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 32 * unit,
                    color: colors.background,
                    textTransform: 'uppercase',
                    letterSpacing: 3 * unit,
                    transform: `scale(${inS})`,
                  }}
                >
                  {t.event}
                </div>
                <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
                  <div style={{transform: `translateX(${(1 - inS) * 110}%) rotate(${(1 - inS) * 10 + (i % 2 ? 1.5 : -1.5)}deg) translateX(${out * -60}%)`}}>
                    <Template
                      style={t.style as TemplateStyle}
                      layout={layout}
                      title={t.title}
                      subtitle={t.subtitle}
                      height={height}
                      shootFrom={14}
                      shootEvery={7}
                    />
                  </div>
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
  const t = promo.templates[0];
  const h = vertical ? 760 : 520;
  const w = h * LAYOUT_RATIO.strip;
  const out = interpolate(frame, [8, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Stack gap={vertical ? 50 : 26}>
      <Sfx name="printer" at={8} volume={0.6} />
      <Sfx name="ding" at={52} volume={0.45} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div
          style={{
            width: (w + 160) * unit,
            height: 70 * unit,
            borderRadius: 18 * unit,
            background: 'linear-gradient(180deg, #3a362f, #1d1b17)',
            border: `${2 * unit}px solid ${colors.gold}66`,
            position: 'relative',
            zIndex: 2,
            boxShadow: `0 ${10 * unit}px ${30 * unit}px rgba(0,0,0,0.6)`,
          }}
        >
          <div style={{position: 'absolute', left: 50 * unit, right: 50 * unit, bottom: 16 * unit, height: 8 * unit, borderRadius: 4, background: '#000'}} />
        </div>
        <div style={{height: (h + 40) * unit, overflow: 'hidden', marginTop: -24 * unit, padding: `0 ${40 * unit}px`}}>
          <div style={{transform: `translateY(${(out - 1) * 100}%)`, paddingTop: 10 * unit}}>
            <Template style={t.style as TemplateStyle} layout="strip" title={t.title} subtitle={t.subtitle} height={h} shootFrom={-200} />
          </div>
        </div>
      </div>
      <Reveal delay={40}>
        <Title size={vertical ? 84 : 70} italic gold>
          {promo.prints.title}
        </Title>
      </Reveal>
      <Reveal delay={46}>
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: (vertical ? 36 : 30) * unit, color: colors.muted, textAlign: 'center', maxWidth: (vertical ? 760 : 860) * unit}}>
          {promo.prints.subtitle}
        </div>
      </Reveal>
    </Stack>
  );
};

// 5. Tout est inclus
export const IncludedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const items = promo.included.items;
  return (
    <Stack gap={vertical ? 46 : 26}>
      <Reveal>
        <Title size={vertical ? 84 : 70} italic gold>
          {promo.included.title}
        </Title>
      </Reveal>
      <div style={{display: 'flex', flexDirection: 'column', gap: (vertical ? 22 : 14) * unit, width: (vertical ? 800 : 820) * unit}}>
        {items.map((it, i) => {
          const at = 12 + i * 9;
          const s = spring({frame: frame - at, fps, config: {damping: 14}});
          return (
            <div
              key={it.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24 * unit,
                padding: `${(vertical ? 20 : 14) * unit}px ${28 * unit}px`,
                borderRadius: 20 * unit,
                background: 'rgba(212,175,55,0.08)',
                border: `${2 * unit}px solid ${colors.gold}44`,
                transform: `translateX(${(1 - s) * (i % 2 ? 1 : -1) * 60}%)`,
                opacity: s,
              }}
            >
              <Sfx name="pop" at={at} volume={0.35} />
              <div style={{fontSize: (vertical ? 46 : 38) * unit, width: 60 * unit, textAlign: 'center'}}>{it.icon}</div>
              <div style={{fontFamily: sans, fontWeight: 600, fontSize: (vertical ? 36 : 32) * unit, color: colors.cream}}>{it.text}</div>
            </div>
          );
        })}
      </div>
    </Stack>
  );
};

// 6. Les formules et les prix
export const FormulasScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const items = promo.formulas.items;
  return (
    <Stack gap={vertical ? 50 : 34}>
      <Reveal>
        <Kicker>✦ {promo.formulas.title} ✦</Kicker>
      </Reveal>
      <div style={{display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 26 * unit, alignItems: 'stretch'}}>
        {items.map((f, i) => {
          const at = 8 + i * 10;
          const s = spring({frame: frame - at, fps, config: {damping: 12}});
          const star = !!f.badge;
          const glow = star ? 0.5 + 0.5 * Math.sin(frame / 8) : 0;
          return (
            <div
              key={f.name}
              style={{
                position: 'relative',
                width: (vertical ? 760 : 290) * unit,
                padding: `${(vertical ? 30 : 34) * unit}px ${30 * unit}px`,
                borderRadius: 26 * unit,
                background: star ? 'rgba(212,175,55,0.16)' : 'rgba(250,247,240,0.05)',
                border: `${(star ? 4 : 2) * unit}px solid ${star ? colors.gold : colors.gold + '44'}`,
                boxShadow: star ? `0 0 ${(40 + glow * 40) * unit}px ${colors.gold}66` : 'none',
                transform: `scale(${s * (star ? 1.04 : 1)})`,
                display: 'flex',
                flexDirection: vertical ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12 * unit,
                textAlign: vertical ? 'left' : 'center',
              }}
            >
              <Sfx name={star ? 'sparkle' : 'pop'} at={at} volume={star ? 0.5 : 0.35} />
              {star && (
                <div
                  style={{
                    position: 'absolute',
                    top: -22 * unit,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: `${6 * unit}px ${20 * unit}px`,
                    borderRadius: 999,
                    background: goldGradient,
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: 22 * unit,
                    color: colors.background,
                    textTransform: 'uppercase',
                    letterSpacing: 2 * unit,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ★ {f.badge}
                </div>
              )}
              <div>
                <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: 54 * unit, color: colors.cream}}>{f.name}</div>
                <div style={{fontFamily: sans, fontWeight: 500, fontSize: 26 * unit, color: colors.muted}}>{f.detail}</div>
              </div>
              <div style={{fontFamily: sans, fontWeight: 800, fontSize: 64 * unit, color: 'transparent', backgroundImage: goldGradient, WebkitBackgroundClip: 'text', whiteSpace: 'nowrap'}}>
                {f.price}
              </div>
            </div>
          );
        })}
      </div>
    </Stack>
  );
};

// 7. Avis clients
export const ReviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  return (
    <Stack gap={vertical ? 50 : 34}>
      <Sfx name="sparkle" at={2} volume={0.5} />
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
        <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: (vertical ? 62 : 52) * unit, lineHeight: 1.25, color: colors.cream, textAlign: 'center', maxWidth: (vertical ? 780 : 900) * unit}}>
          « {promo.review.quote} »
        </div>
      </Reveal>
      <Reveal delay={38}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 32 * unit, color: colors.gold, letterSpacing: 4 * unit}}>— {promo.review.author}</div>
      </Reveal>
    </Stack>
  );
};

// 8. Appel à l'action final
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const btn = spring({frame: frame - 20, fps, config: {damping: 10, stiffness: 120}});
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  const shine = interpolate(frame % 60, [0, 40], [-30, 130]);
  return (
    <Stack gap={vertical ? 46 : 28}>
      <Sfx name="whoosh" volume={0.4} />
      <Sfx name="ding" at={20} volume={0.5} />
      <Logo size={vertical ? 380 : 280} />
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
        <div style={{fontFamily: sans, fontWeight: 500, fontSize: 30 * unit, color: colors.muted, textAlign: 'center'}}>
          {promo.ctaSub}
          <br />📍 {brand.zone}
        </div>
      </Reveal>
      <div style={{position: 'absolute', bottom: 24 * unit, left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontSize: 15 * unit, color: 'rgba(250,247,240,0.35)'}}>
        {musicCredit}
      </div>
    </Stack>
  );
};
