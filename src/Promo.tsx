import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, Series, staticFile} from 'remotion';
import {promo} from './config';
import voice from '../public/audio/voice/durations.json';
import {Background} from './components/Background';
import {
  CountdownScene,
  CtaScene,
  FormulasScene,
  HookScene,
  IncludedScene,
  PrintScene,
  ReviewScene,
  makeTemplateScene,
} from './components/Scenes';
import {Logo, SceneFade} from './components/ui';

const FPS = 30;
type VoiceKey = keyof typeof voice;

// Chaque scène : durée minimale, phrase de voix off et à quelle image elle démarre dans la scène.
// La scène s'allonge automatiquement si la phrase est plus longue.
// `hold` = temps laissé à l'écran après la fin de la phrase.
type Step = {id: string; min: number; voice: VoiceKey; voiceAt: number; hold?: number; Comp: React.FC; fadeOut?: boolean};
const PLAN: Step[] = [
  {id: 'hook', min: 130, voice: 'hook', voiceAt: 3, hold: 8, Comp: HookScene},
  {id: 'countdown', min: 60, voice: 'smile', voiceAt: 0, Comp: CountdownScene},
  // Chaque cadre reste au moins 4,5 s à l'écran pour qu'on ait le temps de le regarder
  ...promo.templates.map((t, i) => ({
    id: `tpl-${t.style}`,
    min: 135,
    voice: `tpl-${t.style}` as VoiceKey,
    voiceAt: 14,
    hold: 45,
    Comp: makeTemplateScene(i),
  })),
  {id: 'prints', min: 120, voice: 'prints', voiceAt: 8, hold: 15, Comp: PrintScene},
  {id: 'included', min: 150, voice: 'included', voiceAt: 8, hold: 20, Comp: IncludedScene},
  {id: 'formulas', min: 130, voice: 'formulas', voiceAt: 8, hold: 20, Comp: FormulasScene},
  {id: 'review', min: 110, voice: 'review', voiceAt: 8, hold: 25, Comp: ReviewScene},
  {id: 'cta', min: 180, voice: 'cta', voiceAt: 12, hold: 36, Comp: CtaScene, fadeOut: false},
];

const scenes = PLAN.reduce<(typeof PLAN[number] & {from: number; duration: number})[]>((acc, s) => {
  const from = acc.length ? acc[acc.length - 1].from + acc[acc.length - 1].duration : 0;
  const duration = Math.max(s.min, s.voiceAt + Math.ceil(voice[s.voice] * FPS) + (s.hold ?? 12));
  return [...acc, {...s, from, duration}];
}, []);

export const PROMO_DURATION = scenes[scenes.length - 1].from + scenes[scenes.length - 1].duration;

// Périodes où la voix parle (en images) : la musique baisse pendant ces moments
const speaking = scenes.map((s) => [s.from + s.voiceAt, s.from + s.voiceAt + Math.ceil(voice[s.voice] * FPS)]);

const musicVolume = (f: number) => {
  const duck = speaking.some(([a, b]) => f >= a - 6 && f <= b + 6);
  const fadeIn = interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(f, [PROMO_DURATION - 45, PROMO_DURATION], [1, 0], {extrapolateLeft: 'clamp'});
  // musique volontairement basse : la voix et les visuels passent avant
  return (duck ? 0.07 : 0.2) * fadeIn * fadeOut;
};

export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Audio src={staticFile('audio/funky-chunk.mp3')} volume={musicVolume} />
    {scenes.map((s) => (
      <Sequence key={`v-${s.id}`} from={s.from + s.voiceAt} layout="none">
        <Audio src={staticFile(`audio/voice/${s.voice}.wav`)} volume={1} />
      </Sequence>
    ))}
    <Series>
      {scenes.map(({id, duration, Comp, fadeOut}) => (
        <Series.Sequence key={id} durationInFrames={duration}>
          <SceneFade duration={duration} fadeOut={fadeOut !== false}>
            <Comp />
          </SceneFade>
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

// Intro logo courte (YouTube, écran pendant l'événement)
export const LogoIntro: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Audio src={staticFile('audio/sfx-ding.wav')} volume={0.5} />
    <SceneFade duration={120}><Logo size={560} /></SceneFade>
  </AbsoluteFill>
);
