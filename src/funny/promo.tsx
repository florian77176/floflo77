import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Series, staticFile, useCurrentFrame} from 'remotion';
import {rounded} from '../fonts';
import {Sfx} from '../components/Scenes';
import {Flash, SAFE_ZONES, SafeContext, SceneFade, useUnit} from '../components/ui';
import {funny, funnyMusic, funnyMusicCredit} from './config';
import {Annotation, Clip3D} from './clip3d';
import {FBEAT, FunnyBackground, Pill, usePopAt} from './parts';

const {colors} = funny;

// ─── Plans « photo 3D » ───────────────────────────────────────────────────
// Les vraies photos du site, animées en 3D (tools/parallax.py → public/funny/clips/), avec des annotations
// dessinées (hauteurs réelles du site, flèches). Les profondeurs d viennent de tools/anchor_depth.py.
export type ShotDef = {
  id: string;
  clip: string; // public/funny/clips/<clip>.mp4
  orbit: number; // même valeur que celle passée à tools/parallax.py
  caption: string;
  kicker?: string; // petit texte au-dessus
  sub?: string; // petit texte en dessous
  price?: string;
  annotations?: Annotation[];
  beats: number;
};

export const SHOTS: ShotDef[] = [
  {
    id: 'lego',
    clip: 'lego',
    orbit: 0.5,
    kicker: 'Une structure de',
    caption: '5,3 MÈTRES',
    sub: 'de haut 🤯',
    price: 'LEGO géante · dès 450 €',
    annotations: [{kind: 'measure', x: 0.8, top: 0.2, bottom: 0.86, dTop: 0.38, dBottom: 0.75, label: '5,3 m', at: 10}],
    beats: 6,
  },
  {
    id: 'safari',
    clip: 'safari',
    orbit: -0.5,
    caption: 'Château Safari World 🐘',
    price: 'dès 280 € · ~9 enfants',
    annotations: [
      {kind: 'measure', x: 0.19, top: 0.15, bottom: 0.74, dTop: 0.4, dBottom: 0.57, label: '3,9 m', at: 6},
      {kind: 'arrow', from: [0.6, 0.62], to: [0.84, 0.47], dFrom: 0.43, dTo: 0.27, label: 'toboggan', at: 22},
    ],
    beats: 6,
  },
  {id: 'toboggan', clip: 'toboggan', orbit: 0.3, caption: 'Ça glisse 🛝', beats: 2},
  {id: 'obstacles', clip: 'obstacles', orbit: -0.4, caption: 'Parcours d’obstacles 💪', beats: 2},
  {
    id: 'p4',
    clip: 'p4',
    orbit: 0.4,
    caption: 'Puissance 4 basket 🏀',
    price: 'dès 180 €',
    annotations: [{kind: 'measure', x: 0.86, top: 0.07, bottom: 0.78, dTop: 0.19, dBottom: 0.25, label: '3,7 m', at: 6}],
    beats: 4,
  },
  {id: 'hache', clip: 'hache', orbit: -0.3, caption: 'Lancer de hache 🪓', beats: 3},
  {id: 'bubble', clip: 'bubble', orbit: 0.5, caption: 'Bubble foot ⚽', price: 'jusqu’à 10 adultes', beats: 3},
  {id: 'cible', clip: 'cible-foot', orbit: -0.4, caption: 'Cible foot géante 🎯', beats: 3},
];

// Texte façon sous-titres TikTok : blanc, gros contour noir
export const Caption: React.FC<{children: React.ReactNode; size: number; color?: string; at?: number; maxWidth?: number}> = ({
  children,
  size,
  color = '#fff',
  at = 0,
  maxWidth,
}) => {
  const {unit} = useUnit();
  const s = usePopAt(at, 260, 13);
  const st = Math.max(3, size * 0.07) * unit;
  const ring = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `${(Math.cos((a * Math.PI) / 180) * st).toFixed(1)}px ${(Math.sin((a * Math.PI) / 180) * st).toFixed(1)}px 0 #111`)
    .join(', ');
  return (
    <div
      style={{
        fontFamily: rounded,
        fontWeight: 800,
        fontSize: size * unit,
        lineHeight: 1.05,
        color,
        textAlign: 'center',
        textShadow: `${ring}, 0 ${st * 2.2}px ${st * 3}px rgba(0,0,0,0.45)`,
        transform: `scale(${s})`,
        maxWidth: maxWidth ? maxWidth * unit : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const makeShot = (shot: ShotDef, first: boolean): React.FC => () => {
  const {vertical} = useUnit();
  return (
    <>
      <Clip3D clip={shot.clip} orbit={shot.orbit} annotations={shot.annotations} />
      {!first && <Sfx name="whoosh" volume={0.5} />}
      {shot.price && <Sfx name="pop" at={first ? 3 * FBEAT : FBEAT} volume={0.6} />}
      {shot.annotations?.map((a, i) => <Sfx key={i} name="pop" at={a.at + 8} volume={0.5} />)}
      <AbsoluteFill style={{justifyContent: 'space-between', alignItems: 'center', padding: '2% 0'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          {shot.kicker && (
            <Caption size={vertical ? 70 : 58} at={first ? -10 : 0}>
              {shot.kicker}
            </Caption>
          )}
          <Caption size={vertical ? (first ? 150 : 96) : first ? 116 : 80} color={first ? colors.yellow : '#fff'} at={first ? -10 : 0} maxWidth={900}>
            {shot.caption}
          </Caption>
          {shot.sub && (
            <Caption size={vertical ? 70 : 58} at={first ? -10 : 0}>
              {shot.sub}
            </Caption>
          )}
        </div>
        {shot.price ? (
          <Pill size={vertical ? 60 : 50} bg={colors.red} at={first ? 3 * FBEAT : FBEAT} rotate={-3}>
            {shot.price}
          </Pill>
        ) : (
          <div />
        )}
      </AbsoluteFill>
      {!first && <Flash strength={0.55} />}
    </>
  );
};

// ─── Plan « on s'occupe de tout » ─────────────────────────────────────────
export const EaseScene: React.FC = () => {
  const {unit, vertical} = useUnit();
  const items = ['🚚 On livre, on installe, on reprend', '🧼 Matériel nettoyé & contrôlé', '⭐ 5/5 · 25 avis Google'];
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (vertical ? 34 : 22) * unit}}>
      <Sfx name="whoosh" volume={0.5} />
      <Caption size={vertical ? 96 : 78}>Les enfants : 🤩</Caption>
      <Caption size={vertical ? 96 : 78} at={FBEAT / 2}>
        Toi : 😎
      </Caption>
      {items.map((t, i) => (
        <React.Fragment key={t}>
          <Sfx name="pop" at={FBEAT * (1 + i)} volume={0.55} />
          <Pill size={vertical ? 58 : 46} bg={i === 2 ? colors.red : colors.dark} at={FBEAT * (1 + i)} rotate={i % 2 ? 2 : -2}>
            {t}
          </Pill>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Appel à l'action ─────────────────────────────────────────────────────
export const PromoCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const logo = usePopAt(0, 160, 9);
  const btn = usePopAt(FBEAT, 160);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (vertical ? 26 : 14) * unit}}>
        <Sfx name="boing" volume={0.6} />
        <Sfx name="confetti" at={FBEAT} volume={0.6} />
        <Img
          src={staticFile(funny.logo)}
          style={{width: (vertical ? 500 : 320) * unit, transform: `scale(${logo}) rotate(${(1 - logo) * -30}deg)`, filter: `drop-shadow(0 ${10 * unit}px ${16 * unit}px rgba(0,0,0,0.25))`}}
        />
        <div style={{transform: `scale(${btn * pulse}) rotate(-2deg)`}}>
          <Pill size={vertical ? 70 : 58}>Réserve ton week-end 🎉</Pill>
        </div>
        <Caption size={vertical ? 70 : 56} at={2 * FBEAT}>
          {funny.site}
        </Caption>
        <Caption size={vertical ? 62 : 50} color={colors.yellow} at={2.5 * FBEAT}>
          📞 {funny.phone}
        </Caption>
        <Pill size={vertical ? 38 : 30} bg="#fff" color={colors.dark} at={3 * FBEAT}>
          ✓ Devis gratuit en 24h
        </Pill>
        <Pill size={vertical ? 38 : 30} bg="#fff" color={colors.dark} at={3 * FBEAT + 4} rotate={2}>
          📅 Réserve 2 à 3 semaines avant
        </Pill>
        <Caption size={vertical ? 34 : 28} at={3.5 * FBEAT}>
          📍 {funny.zone}
        </Caption>
      </div>
      <div style={{position: 'absolute', bottom: 4 * unit, left: 0, right: 0, textAlign: 'center', fontFamily: rounded, fontSize: 16 * unit, color: 'rgba(22,22,22,0.55)'}}>
        {funnyMusicCredit}
      </div>
    </>
  );
};

// ─── Montage ──────────────────────────────────────────────────────────────
export type PromoCut = 'full' | 'story';
export type PromoProps = {withMusic: boolean; cut: PromoCut; safe: keyof typeof SAFE_ZONES};

const STORY_SHOTS = ['lego', 'safari', 'p4', 'bubble'];

const steps = (cut: PromoCut) => {
  const shots = cut === 'full' ? SHOTS : SHOTS.filter((s) => STORY_SHOTS.includes(s.id));
  return [
    ...shots.map((s, i) => ({id: s.id, beats: s.beats, Comp: makeShot(s, i === 0), photo: true})),
    {id: 'ease', beats: cut === 'full' ? 6 : 5, Comp: EaseScene, photo: false},
    {id: 'cta', beats: 8, Comp: PromoCta, photo: false},
  ];
};

const timeline = (cut: PromoCut) => {
  let beat = 0;
  return steps(cut).map((s) => {
    const from = Math.round(beat * FBEAT);
    beat += s.beats;
    return {...s, from, duration: Math.round(beat * FBEAT) - from};
  });
};

export const promoDuration = (cut: PromoCut) => {
  const t = timeline(cut);
  return t[t.length - 1].from + t[t.length - 1].duration;
};

export const FunnyPromo: React.FC<PromoProps> = ({withMusic, cut, safe}) => {
  const scenes = timeline(cut);
  const total = promoDuration(cut);
  const zone = SAFE_ZONES[safe];
  return (
    <SafeContext.Provider value={zone}>
      <AbsoluteFill>
        <FunnyBackground />
        {withMusic && (
          <Audio
            src={staticFile(funnyMusic.file)}
            trimBefore={Math.round(funnyMusic.startSec * 30)}
            volume={(f) => 0.8 * interpolate(f, [total - 30, total], [1, 0], {extrapolateLeft: 'clamp'})}
          />
        )}
        <div style={{position: 'absolute', top: zone.top, right: zone.right, bottom: zone.bottom, left: zone.left}}>
          <Series>
            {scenes.map(({id, duration, Comp, photo}, i) => (
              <Series.Sequence key={id} durationInFrames={duration}>
                {/* les photos s'enchaînent en coupe franche (pas de fondu), sur le temps */}
                <SceneFade duration={duration} fadeIn={!photo && i > 0} fadeOut={id === 'ease'}>
                  <Comp />
                </SceneFade>
              </Series.Sequence>
            ))}
          </Series>
        </div>
      </AbsoluteFill>
    </SafeContext.Provider>
  );
};
