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
  TEMPLATE_DURATION,
  TemplatesScene,
} from './components/Scenes';
import {Logo, SceneFade} from './components/ui';

const FPS = 30;
type VoiceKey = keyof typeof voice;

// Chaque scène : durée minimale, phrase de voix off et à quelle image elle démarre dans la scène.
// La scène s'allonge automatiquement si la phrase est plus longue.
const PLAN: {id: string; min: number; voice: VoiceKey; voiceAt: number; Comp: React.FC; fadeOut?: boolean}[] = [
  {id: 'hook', min: 60, voice: 'hook', voiceAt: 3, Comp: HookScene},
  {id: 'countdown', min: 60, voice: 'smile', voiceAt: 0, Comp: CountdownScene},
  {id: 'templates', min: TEMPLATE_DURATION * promo.templates.length + 20, voice: 'templates', voiceAt: 10, Comp: TemplatesScene},
  {id: 'prints', min: 105, voice: 'prints', voiceAt: 8, Comp: PrintScene},
  {id: 'included', min: 120, voice: 'included', voiceAt: 8, Comp: IncludedScene},
  {id: 'formulas', min: 120, voice: 'formulas', voiceAt: 8, Comp: FormulasScene},
  {id: 'review', min: 100, voice: 'review', voiceAt: 8, Comp: ReviewScene},
  {id: 'cta', min: 165, voice: 'cta', voiceAt: 12, Comp: CtaScene, fadeOut: false},
];

const scenes = PLAN.reduce<(typeof PLAN[number] & {from: number; duration: number})[]>((acc, s) => {
  const from = acc.length ? acc[acc.length - 1].from + acc[acc.length - 1].duration : 0;
  const duration = Math.max(s.min, s.voiceAt + Math.ceil(voice[s.voice] * FPS) + 12);
  return [...acc, {...s, from, duration}];
}, []);

export const PROMO_DURATION = scenes[scenes.length - 1].from + scenes[scenes.length - 1].duration;

// Périodes où la voix parle (en images) : la musique baisse pendant ces moments
const speaking = scenes.map((s) => [s.from + s.voiceAt, s.from + s.voiceAt + Math.ceil(voice[s.voice] * FPS)]);

const musicVolume = (f: number) => {
  const duck = speaking.some(([a, b]) => f >= a - 6 && f <= b + 6);
  const fadeIn = interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(f, [PROMO_DURATION - 45, PROMO_DURATION], [1, 0], {extrapolateLeft: 'clamp'});
  return (duck ? 0.14 : 0.42) * fadeIn * fadeOut;
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
