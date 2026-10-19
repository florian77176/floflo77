import React, {createContext, useContext} from 'react';
import {Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, music, musicCredit, reel} from '../config';
import {sans, serif} from '../fonts';
import {LAYOUT_RATIO, Template, TemplateLayout, TemplateStyle} from './Template';
import {Flash, goldGradient, Kicker, Logo, Reveal, Title, useUnit} from './ui';

const {colors} = brand;

// Durée d'un temps musical en images (les animations tombent sur le rythme)
export const BEAT = music.beatSec * 30;

// Les bruitages restent discrets, et encore plus quand la voix off parle
const SFX_GAIN = 0.45;
export const VoiceContext = createContext(false);
// Montage : « full » (reel complet) ou « story » (version courte avec place pour un sondage)
export const CutContext = createContext<'full' | 'story'>('full');

// Effet sonore déclenché à une image donnée de la scène
export const Sfx: React.FC<{name: string; at?: number; volume?: number}> = ({name, at = 0, volume = 0.8}) => {
  const withVoice = useContext(VoiceContext);
  return (
    <Sequence from={Math.round(at)} layout="none">
      <Audio src={staticFile(`audio/sfx-${name}.wav`)} volume={volume * SFX_GAIN * (withVoice ? 0.4 : 1)} />
    </Sequence>
  );
};

const Stack: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 40}) => {
  const {unit} = useUnit();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap * unit, padding: `0 ${50 * unit}px`}}>
      {children}
    </div>
  );
};

const usePop = (at: number, stiffness = 180) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at), fps, config: {damping: 12, stiffness}});
};

const NumberBadge: React.FC<{n: number; size: number; at?: number}> = ({n, size, at = 0}) => {
  const {unit} = useUnit();
  const s = usePop(at, 220);
  return (
    <div
      style={{
        width: size * unit,
        height: size * unit,
        borderRadius: '50%',
        background: goldGradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: sans,
        fontWeight: 900,
        fontSize: size * 0.58 * unit,
        color: colors.background,
        transform: `scale(${s}) rotate(${(1 - s) * -40}deg)`,
        boxShadow: `0 0 ${size * 0.4 * unit}px ${colors.gold}88`,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
};

// 1. Accroche : « Tu choisis lequel ? 1, 2, 3 ou 4 ? »
// Le texte est lisible dès la toute première image (aperçu du reel dans le fil) puis « respire » sur le rythme.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const settle = interpolate(frame, [0, 10], [1.08, 1], {extrapolateRight: 'clamp'});
  const beatPulse = 1 + 0.03 * Math.exp(-(frame % BEAT) / 4);
  const c = usePop(BEAT);
  return (
    <Stack gap={20}>
      <Sfx name="pop" at={BEAT} volume={0.6} />
      <Kicker>✦ {reel.kicker} ✦</Kicker>
      <div style={{transform: `scale(${settle})`}}>
        <Title size={vertical ? 120 : 104}>{reel.hook[0]}</Title>
      </div>
      <div style={{transform: `scale(${settle * beatPulse}) rotate(-2deg)`, marginTop: -20 * unit}}>
        <Title size={vertical ? 150 : 128} italic gold>
          {reel.hook[1]}
        </Title>
      </div>
      <div
        style={{
          transform: `scale(${c})`,
          marginTop: 20 * unit,
          padding: `${16 * unit}px ${44 * unit}px`,
          borderRadius: 999,
          border: `${3 * unit}px solid ${colors.gold}`,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: (vertical ? 50 : 44) * unit,
          color: colors.cream,
        }}
      >
        {reel.hookSub}
      </div>
    </Stack>
  );
};

// 2. Un cadre numéroté : il glisse, les photos se prennent sur le rythme, le titre s'écrit
const SHOOT_FROM = Math.round(BEAT * 0.8);
const SHOOT_EVERY = Math.round(BEAT / 2);

export const makeTemplateScene = (index: number): React.FC => () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const t = reel.templates[index];
  const layout = t.layout as TemplateLayout;
  const maxW = vertical ? 820 : 760;
  const maxH = vertical ? 980 : 640;
  const height = Math.min(maxH, maxW / LAYOUT_RATIO[layout]);
  const slots = {strip: 3, grid: 4, single: 1, duo: 2, logo: 1}[layout];
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 200}});
  const exit = interpolate(frame, [durationInFrames - 7, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.04]);
  const chip = usePop(3);
  return (
    <Stack gap={vertical ? 40 : 22}>
      <Sfx name="whoosh" volume={0.5} />
      {new Array(slots).fill(0).map((_, k) => (
        <Sfx key={k} name="shutter" at={SHOOT_FROM + k * SHOOT_EVERY} volume={0.7} />
      ))}
      <div style={{display: 'flex', alignItems: 'center', gap: 24 * unit}}>
        <NumberBadge n={index + 1} size={vertical ? 120 : 100} />
        <div
          style={{
            transform: `translateX(${(1 - chip) * -40}px)`,
            opacity: chip,
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: (vertical ? 84 : 70) * unit,
            color: colors.cream,
          }}
        >
          {t.event}
        </div>
      </div>
      <div style={{height: maxH * unit, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `translateX(${(1 - enter) * 110 - exit * 120}%) rotate(${(1 - enter) * 10 + (index % 2 ? 1.5 : -1.5)}deg) scale(${drift})`,
          }}
        >
          <Template
            style={t.style as TemplateStyle}
            layout={layout}
            title={t.title}
            subtitle={t.subtitle}
            height={height}
            shootFrom={SHOOT_FROM}
            shootEvery={SHOOT_EVERY}
          />
        </div>
      </div>
    </Stack>
  );
};

// 3. Récap : les 4 cadres côte à côte, numérotés → « Commente ton numéro »
export const RecapScene: React.FC = () => {
  const {unit, vertical} = useUnit();
  const story = useContext(CutContext) === 'story';
  const cellW = vertical ? 400 : 420;
  const cellH = vertical ? (story ? 400 : 470) : 330;
  const text = usePop(BEAT);
  return (
    <Stack gap={vertical ? 40 : 24}>
      <Sfx name="sparkle" at={BEAT} volume={0.6} />
      <div style={{display: 'grid', gridTemplateColumns: `repeat(2, ${cellW * unit}px)`, gap: `${30 * unit}px ${30 * unit}px`}}>
        {reel.templates.map((t, i) => (
          <RecapCell key={t.event} index={i} w={cellW} h={cellH} />
        ))}
      </div>
      <div style={{transform: `scale(${text})`}}>
        <Title size={vertical ? 80 : 64} italic gold>
          {story ? reel.storyRecap : reel.recap}
        </Title>
      </div>
      {/* espace libre pour poser le sticker sondage dans Instagram / Facebook */}
      {story && <div style={{height: 230 * unit}} />}
    </Stack>
  );
};

export const RecapCell: React.FC<{index: number; w: number; h: number}> = ({index, w, h}) => {
  const {unit} = useUnit();
  const t = reel.templates[index];
  const layout = t.layout as TemplateLayout;
  const height = Math.min(h - 20, (w - 20) / LAYOUT_RATIO[layout]);
  const s = usePop((index * BEAT) / 2, 200);
  return (
    <div style={{width: w * unit, height: h * unit, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`}}>
      <Sfx name="pop" at={(index * BEAT) / 2} volume={0.5} />
      <Template style={t.style as TemplateStyle} layout={layout} title={t.title} subtitle={t.subtitle} height={height} shootFrom={-300} />
      <div style={{position: 'absolute', top: -14 * unit, left: -10 * unit}}>
        <NumberBadge n={index + 1} size={74} at={(index * BEAT) / 2} />
      </div>
    </div>
  );
};

// 4. Le tirage sort de l'imprimante
export const PrintScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const t = reel.templates[0];
  const h = vertical ? 820 : 560;
  const w = h * LAYOUT_RATIO.strip;
  const out = interpolate(frame, [3, 3 + 2 * BEAT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = usePop(BEAT);
  return (
    <Stack gap={vertical ? 40 : 24}>
      <Sfx name="printer" at={3} volume={0.6} />
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
            <Template style={t.style as TemplateStyle} layout="strip" title={t.title} subtitle={t.subtitle} height={h} shootFrom={-300} />
          </div>
        </div>
      </div>
      <div style={{transform: `scale(${title})`}}>
        <Title size={vertical ? 92 : 76} italic gold>
          {reel.prints}
        </Title>
      </div>
    </Stack>
  );
};

// 5. Prix + avis + appel à l'action, chaque élément arrive sur un temps
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const price = usePop(BEAT);
  const stars = usePop(2 * BEAT);
  const btn = usePop(3 * BEAT, 140);
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  const shine = interpolate(frame % 60, [0, 40], [-30, 130]);
  return (
    <>
      <Stack gap={vertical ? 34 : 20}>
        <Sfx name="whoosh" volume={0.5} />
        <Sfx name="pop" at={BEAT} volume={0.6} />
        <Sfx name="sparkle" at={2 * BEAT} volume={0.6} />
        <Sfx name="ding" at={3 * BEAT} volume={0.6} />
        <Logo size={vertical ? 300 : 230} />
        <div style={{transform: `scale(${price})`}}>
          <Title size={vertical ? 130 : 110} italic gold>
            {reel.price}
          </Title>
        </div>
        <div style={{transform: `scale(${stars})`, fontFamily: sans, fontWeight: 700, fontSize: (vertical ? 40 : 34) * unit, color: colors.cream}}>
          <span style={{color: colors.gold}}>★★★★★</span> {reel.stars}
        </div>
        <div
          style={{
            transform: `scale(${btn * pulse})`,
            padding: `${28 * unit}px ${66 * unit}px`,
            borderRadius: 999,
            background: `linear-gradient(110deg, transparent ${shine - 10}%, rgba(255,255,255,0.5) ${shine}%, transparent ${shine + 10}%), ${goldGradient}`,
            fontFamily: sans,
            fontWeight: 800,
            fontSize: (vertical ? 46 : 42) * unit,
            whiteSpace: 'nowrap',
            color: colors.background,
            textTransform: 'uppercase',
            letterSpacing: 2 * unit,
            boxShadow: `0 0 ${70 * unit}px ${colors.gold}77`,
          }}
        >
          {reel.cta}
        </div>
        <Reveal delay={Math.round(4 * BEAT)}>
          <div style={{fontFamily: sans, fontWeight: 800, fontSize: (vertical ? 64 : 52) * unit, color: colors.cream, textAlign: 'center', lineHeight: 1.2}}>
            {brand.site}
            <div style={{fontSize: (vertical ? 44 : 38) * unit, color: colors.gold}}>📞 {brand.phone}</div>
          </div>
        </Reveal>
        <Reveal delay={Math.round(4.5 * BEAT)}>
          <div style={{fontFamily: sans, fontWeight: 500, fontSize: (vertical ? 32 : 28) * unit, color: colors.muted, textAlign: 'center'}}>
            {reel.ctaSub}
            <br />📍 {brand.zone}
          </div>
        </Reveal>
      </Stack>
      {/* crédit musique, en bas de la zone visible (au-dessus de l'interface du réseau) */}
      <div
        style={{
          position: 'absolute',
          bottom: 4 * unit,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: sans,
          fontSize: 15 * unit,
          color: 'rgba(250,247,240,0.35)',
        }}
      >
        {musicCredit}
      </div>
      <Flash strength={0.45} />
    </>
  );
};
