import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Series, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rounded} from '../fonts';
import {Sfx} from '../components/Scenes';
import {Flash, SAFE_ZONES, SafeContext, SceneFade, useUnit} from '../components/ui';
import {funny, funnyMusic, funnyMusicCredit} from './config';
import {FBEAT, FunnyBackground, Pill, usePopAt} from './parts';

const {colors} = funny;

// ─── Plans « photo réelle plein écran » ───────────────────────────────────
// Les vraies photos du site, en plein écran : on voit la taille des structures et on s'imagine chez soi.
export type ShotDef = {
  id: string;
  photo: string; // dans public/funny/photos/
  focus?: string; // cadrage (object-position)
  caption: string;
  kicker?: string; // petit texte au-dessus (ex. « POV : »)
  price?: string;
  beats: number;
};

export const SHOTS: ShotDef[] = [
  {id: 'lego', photo: 'lego', focus: '50% 60%', kicker: 'POV :', caption: 't’as transformé ton jardin 🤯', price: 'LEGO géante · dès 450 €', beats: 5},
  {id: 'safari', photo: 'safari', focus: '45% 50%', caption: 'Château Safari World 🐘', price: 'dès 280 €', beats: 3},
  {id: 'toboggan', photo: 'toboggan', focus: '50% 50%', caption: 'Toboggan géant 🛝', beats: 2},
  {id: 'obstacles', photo: 'obstacles', focus: '55% 50%', caption: 'Parcours d’obstacles 💪', beats: 2},
  {id: 'bubble', photo: 'bubble', focus: '50% 70%', caption: 'Bubble foot ⚽', beats: 2},
  {id: 'hache', photo: 'hache', focus: '50% 55%', caption: 'Lancer de hache 🪓', beats: 2},
  {id: 'cible', photo: 'cible-foot', focus: '35% 50%', caption: 'Cible foot géante 🎯', beats: 2},
  {id: 'p4', photo: 'p4', focus: '50% 55%', caption: 'Puissance 4 basket 🏀', price: 'dès 180 €', beats: 3},
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

// Photo plein écran (hors zone de sécurité) : « punch » d'entrée sur le temps puis zoom lent
const FullPhoto: React.FC<{src: string; focus?: string}> = ({src, focus = '50% 50%'}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const punch = spring({frame, fps, config: {damping: 16, stiffness: 220}});
  const scale = interpolate(punch, [0, 1], [1.28, 1.06]) + interpolate(frame, [0, durationInFrames], [0, 0.06]);
  return (
    <div style={{position: 'fixed', inset: 0, overflow: 'hidden'}}>
      <Img
        src={staticFile(`funny/photos/${src}.jpg`)}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus, transform: `scale(${scale})`, filter: 'saturate(1.12) contrast(1.04)'}}
      />
      {/* assombrit le haut et le bas pour que le texte reste lisible */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)'}} />
    </div>
  );
};

export const makeShot = (shot: ShotDef, first: boolean): React.FC => () => {
  const {vertical} = useUnit();
  return (
    <>
      <FullPhoto src={shot.photo} focus={shot.focus} />
      {!first && <Sfx name="whoosh" volume={0.5} />}
      {shot.price && <Sfx name="pop" at={first ? 2 * FBEAT : FBEAT} volume={0.6} />}
      <AbsoluteFill style={{justifyContent: 'space-between', alignItems: 'center', padding: '2% 0'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          {shot.kicker && (
            <Caption size={vertical ? 92 : 76} color={colors.yellow} at={first ? -10 : 0}>
              {shot.kicker}
            </Caption>
          )}
          <Caption size={vertical ? (first ? 110 : 96) : first ? 88 : 80} at={first ? -10 : 0} maxWidth={first ? 900 : 900}>
            {shot.caption}
          </Caption>
        </div>
        {shot.price ? (
          <Pill size={vertical ? 60 : 50} bg={colors.red} at={first ? 2 * FBEAT : FBEAT} rotate={-3}>
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
  const items = ['🚚 On livre & on installe', '🧼 Matériel nettoyé & contrôlé', '⭐ 5/5 · 25 avis Google'];
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (vertical ? 34 : 22) * unit}}>
      <Sfx name="whoosh" volume={0.5} />
      <Caption size={vertical ? 100 : 80}>
        Et toi ?<br />Tu profites 😎
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
        <Pill size={vertical ? 36 : 30} bg="#fff" color={colors.dark} at={3 * FBEAT}>
          ✓ Devis gratuit en 24h · Réserve 2 à 3 semaines avant
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

const STORY_SHOTS = ['lego', 'safari', 'bubble', 'hache', 'p4'];

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
