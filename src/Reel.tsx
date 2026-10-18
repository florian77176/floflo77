import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, Series, staticFile} from 'remotion';
import {music, reel} from './config';
import voice from '../public/audio/voice/durations.json';
import {Background} from './components/Background';
import {BEAT, CtaScene, HookScene, makeTemplateScene, PrintScene, RecapScene, VoiceContext} from './components/Scenes';
import {Logo, SceneFade} from './components/ui';

const FPS = 30;
type VoiceKey = keyof typeof voice;

export type ReelProps = {
  withMusic: boolean;
  withVoice: boolean;
};

// Scènes en nombre de temps musicaux (1 temps ≈ 0,51 s) : chaque coupe tombe sur le rythme.
// Avec la voix, une scène s'allonge (par temps entiers) si sa phrase ne tient pas.
type Step = {id: string; beats: number; Comp: React.FC; voice: VoiceKey; voiceAt: number};
const STEPS: Step[] = [
  {id: 'hook', beats: 4, Comp: HookScene, voice: 'hook', voiceAt: 2},
  ...reel.templates.map((t, i) => ({
    id: `tpl-${t.style}`,
    beats: 6,
    Comp: makeTemplateScene(i),
    voice: `tpl-${t.style}` as VoiceKey,
    voiceAt: 10, // après le « whoosh » d'entrée du cadre
  })),
  {id: 'recap', beats: 8, Comp: RecapScene, voice: 'recap', voiceAt: 4},
  {id: 'prints', beats: 6, Comp: PrintScene, voice: 'prints', voiceAt: 4},
  {id: 'cta', beats: 10, Comp: CtaScene, voice: 'cta', voiceAt: 6},
];

export const timeline = (withVoice: boolean) => {
  let beat = 0;
  return STEPS.map((s) => {
    const needed = withVoice ? Math.ceil((s.voiceAt + voice[s.voice] * FPS + 6) / BEAT) : 0;
    const beats = Math.max(s.beats, needed);
    const from = Math.round(beat * BEAT);
    beat += beats;
    return {...s, from, duration: Math.round(beat * BEAT) - from};
  });
};

export const reelDuration = (withVoice: boolean) => {
  const t = timeline(withVoice);
  return t[t.length - 1].from + t[t.length - 1].duration;
};

export const Reel: React.FC<ReelProps> = ({withMusic, withVoice}) => {
  const scenes = timeline(withVoice);
  const total = reelDuration(withVoice);
  const speaking = scenes.map((s) => [s.from + s.voiceAt, s.from + s.voiceAt + Math.ceil(voice[s.voice] * FPS)]);
  const musicVolume = (f: number) => {
    const fadeOut = interpolate(f, [total - 30, total], [1, 0], {extrapolateLeft: 'clamp'});
    if (!withVoice) return 0.8 * fadeOut;
    const duck = speaking.some(([a, b]) => f >= a - 5 && f <= b + 5);
    return (duck ? 0.18 : 0.35) * fadeOut;
  };
  return (
    <VoiceContext.Provider value={withVoice}>
    <AbsoluteFill>
      <Background />
      {withMusic && <Audio src={staticFile(music.file)} trimBefore={Math.round(music.startSec * FPS)} volume={musicVolume} />}
      {withVoice &&
        scenes.map((s) => (
          <Sequence key={`v-${s.id}`} from={s.from + s.voiceAt} layout="none">
            <Audio src={staticFile(`audio/voice/${s.voice}.wav`)} />
          </Sequence>
        ))}
      <Series>
        {scenes.map(({id, duration, Comp}, i) => (
          <Series.Sequence key={id} durationInFrames={duration}>
            <SceneFade duration={duration} fadeIn={i > 0} fadeOut={i === scenes.length - 1 ? false : id === 'hook' || id === 'recap' || id === 'prints'}>
              <Comp />
            </SceneFade>
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
    </VoiceContext.Provider>
  );
};

// Intro logo courte (YouTube, écran pendant l'événement)
export const LogoIntro: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Audio src={staticFile('audio/sfx-ding.wav')} volume={0.5} />
    <SceneFade duration={120}><Logo size={560} /></SceneFade>
  </AbsoluteFill>
);
