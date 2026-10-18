import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, Series, staticFile} from 'remotion';
import {music, reel} from './config';
import voice from '../public/audio/voice/durations.json';
import {Background} from './components/Background';
import {BEAT, CtaScene, CutContext, HookScene, makeTemplateScene, PrintScene, RecapScene, VoiceContext} from './components/Scenes';
import {Logo, SAFE_ZONES, SafeContext, SceneFade} from './components/ui';

const FPS = 30;
type VoiceKey = keyof typeof voice;
export type Cut = 'full' | 'story';

export type ReelProps = {
  withMusic: boolean;
  withVoice: boolean;
  cut: Cut;
  safe: keyof typeof SAFE_ZONES;
};

// Scènes en nombre de temps musicaux (1 temps ≈ 0,51 s) : chaque coupe tombe sur le rythme.
// Avec la voix, une scène s'allonge (par temps entiers) si sa phrase ne tient pas.
type Step = {id: string; beats: number; Comp: React.FC; voice: VoiceKey; voiceAt: number};
const templateSteps = (beats: number): Step[] =>
  reel.templates.map((t, i) => ({
    id: `tpl-${t.style}`,
    beats,
    Comp: makeTemplateScene(i),
    voice: `tpl-${t.style}` as VoiceKey,
    voiceAt: 10, // après le « whoosh » d'entrée du cadre
  }));

const STEPS: Record<Cut, Step[]> = {
  // Reel complet (~27 s) : Instagram, TikTok, Facebook, Snapchat Spotlight
  full: [
    {id: 'hook', beats: 4, Comp: HookScene, voice: 'hook', voiceAt: 2},
    ...templateSteps(6),
    {id: 'recap', beats: 8, Comp: RecapScene, voice: 'recap', voiceAt: 4},
    {id: 'prints', beats: 6, Comp: PrintScene, voice: 'prints', voiceAt: 4},
    {id: 'cta', beats: 10, Comp: CtaScene, voice: 'cta', voiceAt: 6},
  ],
  // Story (~17 s, < 20 s pour Facebook) : plus rapide, place pour un sondage, pas de scène tirage
  story: [
    {id: 'hook', beats: 4, Comp: HookScene, voice: 'hook', voiceAt: 2},
    ...templateSteps(4),
    {id: 'recap', beats: 6, Comp: RecapScene, voice: 'recap', voiceAt: 4},
    {id: 'cta', beats: 8, Comp: CtaScene, voice: 'cta', voiceAt: 6},
  ],
};

export const timeline = (withVoice: boolean, cut: Cut) => {
  let beat = 0;
  return STEPS[cut].map((s) => {
    const needed = withVoice ? Math.ceil((s.voiceAt + voice[s.voice] * FPS + 6) / BEAT) : 0;
    const beats = Math.max(s.beats, needed);
    const from = Math.round(beat * BEAT);
    beat += beats;
    return {...s, from, duration: Math.round(beat * BEAT) - from};
  });
};

export const reelDuration = (withVoice: boolean, cut: Cut) => {
  const t = timeline(withVoice, cut);
  return t[t.length - 1].from + t[t.length - 1].duration;
};

export const Reel: React.FC<ReelProps> = ({withMusic, withVoice, cut, safe}) => {
  const scenes = timeline(withVoice, cut);
  const total = reelDuration(withVoice, cut);
  const zone = SAFE_ZONES[safe];
  const speaking = scenes.map((s) => [s.from + s.voiceAt, s.from + s.voiceAt + Math.ceil(voice[s.voice] * FPS)]);
  const musicVolume = (f: number) => {
    const fadeOut = interpolate(f, [total - 30, total], [1, 0], {extrapolateLeft: 'clamp'});
    if (!withVoice) return 0.8 * fadeOut;
    const duck = speaking.some(([a, b]) => f >= a - 5 && f <= b + 5);
    return (duck ? 0.18 : 0.35) * fadeOut;
  };
  return (
    <VoiceContext.Provider value={withVoice}>
      <CutContext.Provider value={cut}>
        <SafeContext.Provider value={zone}>
          <AbsoluteFill>
            <Background />
            {withMusic && <Audio src={staticFile(music.file)} trimBefore={Math.round(music.startSec * FPS)} volume={musicVolume} />}
            {withVoice &&
              scenes.map((s) => (
                <Sequence key={`v-${s.id}`} from={s.from + s.voiceAt} layout="none">
                  <Audio src={staticFile(`audio/voice/${s.voice}.wav`)} />
                </Sequence>
              ))}
            {/* le contenu est placé dans la zone visible du réseau ; le fond reste plein écran */}
            <div style={{position: 'absolute', top: zone.top, right: zone.right, bottom: zone.bottom, left: zone.left}}>
              <Series>
                {scenes.map(({id, duration, Comp}, i) => (
                  <Series.Sequence key={id} durationInFrames={duration}>
                    <SceneFade duration={duration} fadeIn={i > 0} fadeOut={i === scenes.length - 1 ? false : id === 'hook' || id === 'recap' || id === 'prints'}>
                      <Comp />
                    </SceneFade>
                  </Series.Sequence>
                ))}
              </Series>
            </div>
          </AbsoluteFill>
        </SafeContext.Provider>
      </CutContext.Provider>
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
