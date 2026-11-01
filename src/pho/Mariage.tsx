import React from 'react';
import {AbsoluteFill, Audio, interpolate, Series, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand, music} from '../config';
import {sans, serif} from '../fonts';
import {Background} from '../components/Background';
import {BEAT, CtaScene, PrintScene, Sfx} from '../components/Scenes';
import {Template, TemplateStyle} from '../components/Template';
import {goldGradient, SAFE_ZONES, SafeContext, SceneFade, Title, useUnit} from '../components/ui';

// Pho Events — « Mariage 2027 » : de novembre à février, les couples réservent leurs prestataires.
// Faits repris de phoevents.fr (formule Signature 280 € avec 200 tirages, « la plus choisie », dès 180 €).

const {colors} = brand;
const NAMES = {title: 'Julie & Thomas', subtitle: '14 · 06 · 2027'}; // exemple fictif

// Sur-titre doré, plus grand que le Kicker standard (lisible sur téléphone)
const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {unit} = useUnit();
  return (
    <div style={{fontFamily: sans, fontWeight: 700, fontSize: 46 * unit, letterSpacing: 6 * unit, textTransform: 'uppercase', color: colors.gold, textAlign: 'center'}}>
      {children}
    </div>
  );
};

const Col: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 30}) => {
  const {unit} = useUnit();
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap * unit}}>{children}</div>;
};

const usePop = (at: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(at), fps, config: {damping: 12, stiffness: 200}});
};

// 1. Accroche, lisible dès la 1re image
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 10], [1.06, 1], {extrapolateRight: 'clamp'});
  return (
    <Col gap={12}>
      <Kicker>✦ Mariage 2027 💍 ✦</Kicker>
      <div style={{transform: `scale(${settle})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Title size={112}>Vos invités</Title>
        <Title size={112} italic gold>
          repartent avec
        </Title>
        <Title size={112} italic gold>
          leur photo ✨
        </Title>
      </div>
    </Col>
  );
};

// 2. Le cadre se remplit : photos prises une à une, prénoms qui s'écrivent
const Strip: React.FC = () => (
  <Col gap={26}>
    <Sfx name="whoosh" volume={0.5} />
    {[0, 1, 2].map((k) => (
      <Sfx key={k} name="shutter" at={10 + k * Math.round(BEAT)} volume={0.7} />
    ))}
    <Kicker>Un cadre à vos prénoms</Kicker>
    <Template style="mariage" layout="strip" title={NAMES.title} subtitle={NAMES.subtitle} height={960} shootFrom={10} shootEvery={Math.round(BEAT)} />
  </Col>
);

// 3. Même cadre, trois ambiances de couleurs
const Colors: React.FC = () => {
  const {unit} = useUnit();
  const styles: TemplateStyle[] = ['mariage', 'bapteme', 'babyshower'];
  return (
    <Col gap={34}>
      <Kicker>Vos couleurs 🎨</Kicker>
      <div style={{display: 'flex', gap: 30 * unit}}>
        {styles.map((st, i) => (
          <PopIn key={st} at={i * (BEAT / 2)}>
            <Sfx name="pop" at={i * (BEAT / 2)} volume={0.5} />
            <Template style={st} layout="strip" title={NAMES.title} subtitle="2027" height={780} shootFrom={-300} />
          </PopIn>
        ))}
      </div>
      <PopIn at={2 * BEAT}>
        <Title size={70} italic gold>
          On s’adapte à votre déco
        </Title>
      </PopIn>
    </Col>
  );
};

const PopIn: React.FC<{children: React.ReactNode; at: number}> = ({children, at}) => {
  const s = usePop(at);
  return <div style={{transform: `scale(${s})`, opacity: Math.min(1, s * 1.5)}}>{children}</div>;
};

// 5. La formule la plus choisie
const Formula: React.FC = () => {
  const {unit} = useUnit();
  const card = usePop(2);
  return (
    <Col gap={26}>
      <Sfx name="sparkle" at={2} volume={0.6} />
      <Kicker>★ La plus choisie ★</Kicker>
      <div
        style={{
          transform: `scale(${card})`,
          padding: `${44 * unit}px ${70 * unit}px`,
          borderRadius: 32 * unit,
          border: `${4 * unit}px solid ${colors.gold}`,
          background: 'rgba(212,175,55,0.12)',
          boxShadow: `0 0 ${80 * unit}px ${colors.gold}55`,
          textAlign: 'center',
        }}
      >
        <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: 96 * unit, color: colors.cream}}>Signature</div>
        <div style={{fontFamily: sans, fontWeight: 800, fontSize: 120 * unit, color: 'transparent', backgroundImage: goldGradient, WebkitBackgroundClip: 'text'}}>
          280 €
        </div>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 40 * unit, color: colors.cream}}>200 tirages imprimés sur place</div>
      </div>
      <PopIn at={BEAT * 2}>
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 42 * unit, color: colors.cream, textAlign: 'center'}}>Formules dès 180 €<br />Cadre personnalisé inclus</div>
      </PopIn>
    </Col>
  );
};

const STEPS: {id: string; beats: number; Comp: React.FC}[] = [
  {id: 'hook', beats: 5, Comp: Hook},
  {id: 'strip', beats: 8, Comp: Strip},
  {id: 'colors', beats: 6, Comp: Colors},
  {id: 'print', beats: 6, Comp: PrintScene},
  {id: 'formula', beats: 5, Comp: Formula},
  {id: 'cta', beats: 9, Comp: CtaScene},
];

const timeline = () => {
  let beat = 0;
  return STEPS.map((s) => {
    const from = Math.round(beat * BEAT);
    beat += s.beats;
    return {...s, from, duration: Math.round(beat * BEAT) - from};
  });
};
export const mariageDuration = () => {
  const t = timeline();
  return t[t.length - 1].from + t[t.length - 1].duration;
};

export const PhoMariage: React.FC<{withMusic: boolean}> = ({withMusic}) => {
  const scenes = timeline();
  const total = mariageDuration();
  const zone = SAFE_ZONES.universal;
  return (
    <SafeContext.Provider value={zone}>
      <AbsoluteFill>
        <Background />
        {withMusic && (
          <Audio
            src={staticFile('audio/funky-chunk.mp3')}
            trimBefore={Math.round(music.startSec * 30)}
            volume={(f) => 0.8 * interpolate(f, [total - 20, total], [1, 0], {extrapolateLeft: 'clamp'})}
          />
        )}
        <div style={{position: 'absolute', top: zone.top, right: zone.right, bottom: zone.bottom, left: zone.left}}>
          <Series>
            {scenes.map(({id, duration, Comp}, i) => (
              <Series.Sequence key={id} durationInFrames={duration}>
                <SceneFade duration={duration} fadeIn={i > 0} fadeOut={i < scenes.length - 1}>
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
