import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, Series, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';
import {Background} from '../components/Background';
import {goldGradient, Logo, SAFE_ZONES, SafeContext, SceneFade, useUnit} from '../components/ui';
import {Confetti3D, Floater, FloatingEmoji} from '../funny/live';

// ─── Pho Events : vidéos à partir de vrais modèles de cadres (Canva, public/pho/templates/) ───────────────
// Les photos d'exemple des modèles sont des personnes fictives générées par l'IA de Canva.

const {colors} = brand;
const FPS = 30;

// Modèles : proportions et emplacements des photos (x, y, l, h en fraction de l'image)
export const TEMPLATES = {
  'mariage-bande': {ratio: 1600 / 2400, slots: [[0.16, 0.09, 0.68, 0.22], [0.16, 0.33, 0.68, 0.22], [0.16, 0.57, 0.68, 0.23]]},
  'mariage-boheme': {ratio: 2400 / 1855, slots: [[0.08, 0.18, 0.41, 0.43], [0.5, 0.18, 0.42, 0.43]]},
  'anniversaire-30': {ratio: 1855 / 2400, slots: [[0.05, 0.05, 0.43, 0.4], [0.51, 0.05, 0.43, 0.4], [0.05, 0.47, 0.43, 0.35], [0.51, 0.47, 0.43, 0.35]]},
  'anniversaire-50': {ratio: 2400 / 1855, slots: [[0.05, 0.34, 0.31, 0.47], [0.365, 0.34, 0.295, 0.47], [0.665, 0.34, 0.285, 0.47]]},
  'bapteme': {ratio: 1800 / 2400, slots: [[0.2, 0.03, 0.6, 0.27], [0.2, 0.31, 0.6, 0.24], [0.2, 0.56, 0.6, 0.23]]},
  'baby-shower': {ratio: 1855 / 2400, slots: [[0.15, 0.3, 0.75, 0.32], [0.15, 0.63, 0.75, 0.32]]},
  'entreprise': {ratio: 1855 / 2400, slots: [[0.12, 0.06, 0.76, 0.25], [0.12, 0.33, 0.76, 0.23], [0.12, 0.58, 0.76, 0.22]]},
} as const;
export type TemplateId = keyof typeof TEMPLATES;

export type Sfx = {name: string; at?: number; vol?: number};
type Entry = 'drop' | 'flip' | 'slide' | 'zoom';
export type Scene =
  | {kind: 'hook'; beats: number; kicker: string; lines: string[]; floaters?: Floater[]; sfx?: Sfx[]}
  | {kind: 'card'; beats: number; tpl: TemplateId; entry?: Entry; num?: number; label?: string; caption?: string;
      tour?: {from: number; every: number; slots: number[]; captions: string[]}; floaters?: Floater[]; sfx?: Sfx[]}
  | {kind: 'grid'; beats: number; tpls: TemplateId[]; numbered?: boolean; text: string; floaters?: Floater[]; sfx?: Sfx[]}
  | {kind: 'formula'; beats: number; sfx?: Sfx[]}
  | {kind: 'cta'; beats: number; question: string; sfx?: Sfx[]};

export type PhoEpisode = {id: string; music: {file: string; start: number; beat: number}; credit?: string; scenes: Scene[]};

const SfxAt: React.FC<{s: Sfx}> = ({s}) => (
  <Sequence from={Math.round((s.at ?? 0) * FPS)} layout="none">
    <Audio src={staticFile(`audio/sfx-${s.name}.wav`)} volume={(s.vol ?? 0.7) * 0.55} />
  </Sequence>
);

const usePop = (at: number, stiffness = 200, damping = 12) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at), fps, config: {damping, stiffness}});
};

// Textes Pho Events (élégants : Montserrat + Cormorant), avec ombre pour rester lisibles sur les photos
const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {unit} = useUnit();
  return (
    <div style={{fontFamily: sans, fontWeight: 700, fontSize: 44 * unit, letterSpacing: 6 * unit, textTransform: 'uppercase', color: colors.gold, textAlign: 'center', textShadow: '0 3px 12px rgba(0,0,0,0.8)'}}>
      {children}
    </div>
  );
};
const Line: React.FC<{children: React.ReactNode; size: number; gold?: boolean; italic?: boolean; at?: number}> = ({children, size, gold, italic, at = 0}) => {
  const {unit} = useUnit();
  const frame = useCurrentFrame();
  const p = usePop(at, 220, 13);
  const rx = Math.sin(frame / 22) * 5;
  const ry = Math.sin(frame / 29) * 7;
  return (
    <div style={{perspective: 900 * unit}}>
      <div
        style={{
          fontFamily: italic ? serif : sans,
          fontStyle: italic ? 'italic' : 'normal',
          fontWeight: italic ? 600 : 800,
          fontSize: size * unit,
          lineHeight: 1.05,
          textAlign: 'center',
          color: gold ? 'transparent' : colors.cream,
          backgroundImage: gold ? goldGradient : undefined,
          WebkitBackgroundClip: gold ? 'text' : undefined,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.75))',
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${p})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Pill: React.FC<{children: React.ReactNode; gold?: boolean; size?: number}> = ({children, gold, size = 46}) => {
  const {unit} = useUnit();
  return (
    <div
      style={{
        padding: `${size * 0.28 * unit}px ${size * 0.7 * unit}px`,
        borderRadius: 999,
        background: gold ? goldGradient : 'rgba(20,18,12,0.85)',
        border: `${3 * unit}px solid ${colors.gold}`,
        color: gold ? colors.background : colors.cream,
        fontFamily: sans,
        fontWeight: 800,
        fontSize: size * unit,
        whiteSpace: 'nowrap',
        boxShadow: `0 ${8 * unit}px ${24 * unit}px rgba(0,0,0,0.5)`,
      }}
    >
      {children}
    </div>
  );
};

const NumBadge: React.FC<{n: number; size?: number; at?: number}> = ({n, size = 130, at = 0}) => {
  const {unit} = useUnit();
  const s = usePop(at, 240);
  return (
    <div
      style={{
        width: size * unit,
        height: size * unit,
        borderRadius: '50%',
        background: goldGradient,
        color: colors.background,
        fontFamily: sans,
        fontWeight: 900,
        fontSize: size * 0.6 * unit,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${s}) rotate(${(1 - s) * -60}deg)`,
        boxShadow: `0 0 ${size * 0.4 * unit}px ${colors.gold}99`,
        border: `${4 * unit}px solid ${colors.cream}`,
      }}
    >
      {n}
    </div>
  );
};

// Tirage photo : entrée 3D, légère oscillation 3D, reflet brillant qui passe, plongée caméra dans les photos
type Tour = {from: number; every: number; slots: number[]};
const PrintCard: React.FC<{tpl: TemplateId; maxW: number; maxH: number; entry?: Entry; tour?: Tour}> = ({
  tpl,
  maxW,
  maxH,
  entry = 'drop',
  tour,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const T = TEMPLATES[tpl];
  const w = Math.min(maxW, maxH * T.ratio) * unit;
  const h = w / T.ratio;
  const p = spring({frame, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
  let enterTf = '';
  if (entry === 'drop') enterTf = `translateY(${(1 - p) * -55}%) rotate(${(1 - p) * -14}deg)`;
  if (entry === 'flip') enterTf = `rotateY(${(1 - p) * 75}deg)`;
  if (entry === 'slide') enterTf = `translateX(${(1 - p) * 65}%) rotate(${(1 - p) * 10}deg)`;
  if (entry === 'zoom') enterTf = `scale(${0.2 + p * 0.8}) rotate(${(1 - p) * 25}deg)`;
  // caméra : zoom vers chaque photo du modèle
  let z = 1;
  let tx = 0;
  let ty = 0;
  if (tour) {
    const states = [{z: 1, cx: 0.5, cy: 0.5}, ...tour.slots.map((k) => {
      const [sx, sy, sw, sh] = T.slots[k];
      // la photo remplit la zone visible (≈ 900 × 1150 unités) sans être coupée
      const fit = Math.min((1110 * unit) / (sw * w), (1080 * unit) / (sh * h));
      return {z: Math.min(3.4, fit), cx: sx + sw / 2, cy: sy + sh / 2};
    })];
    let cur = states[0];
    for (let i = 1; i < states.length; i++) {
      const start = tour.from + (i - 1) * tour.every;
      const q = spring({frame: frame - start, fps, config: {damping: 18, stiffness: 90}});
      const prev = cur;
      const nxt = states[i];
      cur = {z: prev.z + (nxt.z - prev.z) * q, cx: prev.cx + (nxt.cx - prev.cx) * q, cy: prev.cy + (nxt.cy - prev.cy) * q};
    }
    z = cur.z;
    tx = (0.5 - cur.cx) * w * z;
    ty = (0.5 - cur.cy) * h * z;
  }
  const idle = z > 1.05 ? 0 : 1;
  const rx = Math.sin(frame / 25) * 6 * idle;
  const ry = Math.sin(frame / 31) * 9 * idle;
  const shine = interpolate(frame % 75, [10, 45], [-40, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{perspective: 1400 * unit}}>
      <div style={{transform: `translate(${tx}px, ${ty}px) scale(${z}) ${enterTf} rotateX(${rx}deg) rotateY(${ry}deg)`, transformStyle: 'preserve-3d'}}>
        <div
          style={{
            width: w,
            height: h,
            position: 'relative',
            borderRadius: 6 * unit,
            overflow: 'hidden',
            boxShadow: `0 ${30 * unit}px ${70 * unit}px rgba(0,0,0,0.65), 0 0 ${50 * unit}px ${colors.gold}33`,
            backfaceVisibility: 'hidden',
          }}
        >
          <Img src={staticFile(`pho/templates/${tpl}.png`)} style={{width: '100%', height: '100%', display: 'block'}} />
          {/* reflet brillant du papier photo */}
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${shine - 14}%, rgba(255,255,255,0.28) ${shine}%, transparent ${shine + 14}%)`}} />
        </div>
      </div>
    </div>
  );
};

const Col: React.FC<{children: React.ReactNode; gap?: number; justify?: string}> = ({children, gap = 30, justify = 'center'}) => {
  const {unit} = useUnit();
  return <AbsoluteFill style={{flexDirection: 'column', alignItems: 'center', justifyContent: justify, gap: gap * unit}}>{children}</AbsoluteFill>;
};

const HookView: React.FC<{s: Extract<Scene, {kind: 'hook'}>; first: boolean}> = ({s, first}) => (
  <Col gap={8}>
    <Kicker>✦ {s.kicker} ✦</Kicker>
    {s.lines.map((l, i) => (
      <Line key={l} size={i === 0 ? 104 : 116} gold={i > 0} italic={i > 0} at={first ? -30 : i * 4}>
        {l}
      </Line>
    ))}
  </Col>
);

const CardView: React.FC<{s: Extract<Scene, {kind: 'card'}>; bf: number}> = ({s, bf}) => {
  const frame = useCurrentFrame();
  const {unit} = useUnit();
  const tour = s.tour ? {from: Math.round(s.tour.from * bf), every: Math.round(s.tour.every * bf), slots: s.tour.slots} : undefined;
  // légende de la photo en cours pendant la plongée caméra
  let cap: string | undefined = s.caption;
  if (s.tour && tour) {
    const k = Math.floor((frame - tour.from) / tour.every);
    if (frame >= tour.from && k >= 0 && k < s.tour.captions.length) cap = s.tour.captions[k];
  }
  const capKey = cap ?? '';
  return (
    <>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <PrintCard tpl={s.tpl} maxW={TEMPLATES[s.tpl].ratio > 1 ? 840 : 720} maxH={980} entry={s.entry} tour={tour} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'space-between', alignItems: 'flex-start', padding: `${10 * unit}px 0`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18 * unit}}>
          {s.num !== undefined && <NumBadge n={s.num} />}
          {s.label && (
            <PopIn at={4}>
              <Pill>{s.label}</Pill>
            </PopIn>
          )}
        </div>
        <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
          {cap && (
            <PopIn key={capKey} at={tour && frame >= tour.from ? tour.from + Math.floor((frame - tour.from) / tour.every) * tour.every + 3 : 8}>
              {tour && frame >= tour.from ? (
                // pendant la plongée, la photo remplit l'écran : légende sur fond sombre pour rester lisible
                <Pill size={60}>{cap}</Pill>
              ) : (
                <Line size={78} gold italic>
                  {cap}
                </Line>
              )}
            </PopIn>
          )}
        </div>
      </AbsoluteFill>
    </>
  );
};

const PopIn: React.FC<{children: React.ReactNode; at: number}> = ({children, at}) => {
  const s = usePop(at);
  return <div style={{transform: `scale(${s})`, opacity: Math.min(1, s * 1.4)}}>{children}</div>;
};

const GridView: React.FC<{s: Extract<Scene, {kind: 'grid'}>; bf: number}> = ({s, bf}) => {
  const {unit} = useUnit();
  const cols = s.tpls.length > 4 ? 3 : 2;
  const cell = cols === 3 ? 290 : 400;
  return (
    <Col gap={30}>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell * unit}px)`, gap: 24 * unit, justifyItems: 'center', alignItems: 'center'}}>
        {s.tpls.map((t, i) => {
          const r = TEMPLATES[t].ratio;
          const w = r > 1 ? cell : cell * 0.86;
          return (
            <PopIn key={t} at={(i * bf) / 2}>
              <div style={{position: 'relative'}}>
                <Img src={staticFile(`pho/templates/${t}.png`)} style={{width: w * unit, display: 'block', borderRadius: 4 * unit, boxShadow: `0 ${12 * unit}px ${30 * unit}px rgba(0,0,0,0.6)`}} />
                {s.numbered && (
                  <div style={{position: 'absolute', top: -20 * unit, left: -20 * unit}}>
                    <NumBadge n={i + 1} size={78} at={(i * bf) / 2} />
                  </div>
                )}
              </div>
            </PopIn>
          );
        })}
      </div>
      <PopIn at={bf * 1.5}>
        <Pill gold size={52}>
          {s.text}
        </Pill>
      </PopIn>
    </Col>
  );
};

const FormulaView: React.FC = () => {
  const {unit} = useUnit();
  return (
    <Col gap={26}>
      <Kicker>★ La plus choisie ★</Kicker>
      <PopIn at={2}>
        <div style={{padding: `${44 * unit}px ${70 * unit}px`, borderRadius: 32 * unit, border: `${4 * unit}px solid ${colors.gold}`, background: 'rgba(212,175,55,0.12)', boxShadow: `0 0 ${80 * unit}px ${colors.gold}55`, textAlign: 'center'}}>
          <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: 96 * unit, color: colors.cream}}>Signature</div>
          <div style={{fontFamily: sans, fontWeight: 800, fontSize: 124 * unit, color: 'transparent', backgroundImage: goldGradient, WebkitBackgroundClip: 'text'}}>280 €</div>
          <div style={{fontFamily: sans, fontWeight: 600, fontSize: 40 * unit, color: colors.cream}}>200 tirages imprimés sur place</div>
        </div>
      </PopIn>
      <PopIn at={14}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 42 * unit, color: colors.cream, textAlign: 'center'}}>
          Formules dès 180 €<br />Cadre personnalisé inclus
        </div>
      </PopIn>
    </Col>
  );
};

const CtaView: React.FC<{s: Extract<Scene, {kind: 'cta'}>; credit?: string}> = ({s, credit}) => {
  const {unit} = useUnit();
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 6) * 0.025;
  return (
    <>
      <Col gap={24}>
        <Logo size={300} delay={-6} />
        <PopIn at={3}>
          <div style={{transform: `scale(${pulse}) rotate(-2deg)`}}>
            <Pill gold size={58}>
              {s.question}
            </Pill>
          </div>
        </PopIn>
        <PopIn at={6}>
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 40 * unit, color: colors.cream}}>
            <span style={{color: colors.gold}}>★★★★★</span> 5,0 / 5 sur Google
          </div>
        </PopIn>
        <PopIn at={9}>
          <div style={{fontFamily: sans, fontWeight: 800, fontSize: 64 * unit, color: colors.cream, textAlign: 'center', lineHeight: 1.2}}>
            phoevents.fr
            <div style={{fontSize: 46 * unit, color: colors.gold}}>📞 {'07 68 67 27 55'}</div>
          </div>
        </PopIn>
        <PopIn at={12}>
          <div style={{fontFamily: sans, fontWeight: 500, fontSize: 32 * unit, color: colors.muted, textAlign: 'center'}}>
            Devis gratuit · réponse sous 24h
            <br />📍 Seine-et-Marne & Île-de-France
          </div>
        </PopIn>
      </Col>
      {credit && (
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontSize: 15 * unit, color: 'rgba(250,247,240,0.4)'}}>{credit}</div>
      )}
    </>
  );
};

export const phoDuration = (ep: PhoEpisode) => Math.round(ep.scenes.reduce((a, s) => a + s.beats, 0) * ep.music.beat * FPS);

export const PhoTemplateVideo: React.FC<{episode: PhoEpisode; withMusic: boolean}> = ({episode: ep, withMusic}) => {
  const zone = SAFE_ZONES.universal;
  const bf = ep.music.beat * FPS;
  const total = phoDuration(ep);
  let acc = 0;
  const plan = ep.scenes.map((s) => {
    const from = Math.round(acc * bf);
    acc += s.beats;
    return {s, from, frames: Math.round(acc * bf) - from};
  });
  return (
    <SafeContext.Provider value={zone}>
      <AbsoluteFill>
        <Background />
        {withMusic && (
          <Audio src={staticFile(ep.music.file)} trimBefore={Math.round(ep.music.start * FPS)} volume={(f) => 0.8 * interpolate(f, [total - 20, total], [1, 0], {extrapolateLeft: 'clamp'})} />
        )}
        <Series>
          {plan.map(({s, frames}, i) => (
            <Series.Sequence key={i} durationInFrames={frames}>
              <SceneFade duration={frames} fadeIn={false} fadeOut={false}>
                {i > 0 && <SfxAt s={{name: 'whoosh', vol: 0.45}} />}
                {s.kind === 'card' && <SfxAt s={{name: 'shutter', at: 0.15, vol: 0.6}} />}
                {s.kind === 'card' && s.tour && s.tour.slots.map((_, k) => <SfxAt key={k} s={{name: 'shutter', at: ((s.tour!.from + k * s.tour!.every) * bf) / FPS, vol: 0.5}} />)}
                {(s.sfx ?? []).map((x, k) => <SfxAt key={k} s={x} />)}
                <div style={{position: 'absolute', top: zone.top, right: zone.right, bottom: zone.bottom, left: zone.left}}>
                  {s.kind === 'hook' && <HookView s={s} first={i === 0} />}
                  {s.kind === 'card' && <CardView s={s} bf={bf} />}
                  {s.kind === 'grid' && <GridView s={s} bf={bf} />}
                  {s.kind === 'formula' && <FormulaView />}
                  {s.kind === 'cta' && <CtaView s={s} credit={ep.credit} />}
                  {'floaters' in s && (s.floaters ?? []).map((f, k) => <FloatingEmoji key={k} f={f} idx={k} />)}
                </div>
                {s.kind === 'grid' && <Confetti3D at={Math.round(bf * 1.5)} />}
                {s.kind === 'cta' && <Confetti3D at={6} count={50} />}
              </SceneFade>
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
    </SafeContext.Provider>
  );
};
