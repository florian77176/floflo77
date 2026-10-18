import React from 'react';
import {AbsoluteFill, Audio, interpolate, Series, staticFile} from 'remotion';
import {CutContext} from '../components/Scenes';
import {SAFE_ZONES, SafeContext, SceneFade} from '../components/ui';
import {funnyMusic, structures} from './config';
import {FBEAT, FunnyBackground} from './parts';
import {FunnyAllFour, FunnyCta, FunnyHook, FunnyOccasions, makeStructureScene} from './scenes';

export type FunnyCut = 'full' | 'story';
export type FunnyProps = {withMusic: boolean; cut: FunnyCut; safe: keyof typeof SAFE_ZONES};

// Scènes en nombre de temps musicaux : chaque coupe tombe sur le rythme
const STEPS: Record<FunnyCut, {id: string; beats: number; Comp: React.FC}[]> = {
  full: [
    {id: 'hook', beats: 4, Comp: FunnyHook},
    ...structures.map((s, i) => ({id: `s${i}`, beats: 6, Comp: makeStructureScene(i)})),
    {id: 'all', beats: 8, Comp: FunnyAllFour},
    {id: 'occasions', beats: 6, Comp: FunnyOccasions},
    {id: 'cta', beats: 10, Comp: FunnyCta},
  ],
  story: [
    {id: 'hook', beats: 4, Comp: FunnyHook},
    ...structures.map((s, i) => ({id: `s${i}`, beats: 4, Comp: makeStructureScene(i)})),
    {id: 'all', beats: 7, Comp: FunnyAllFour},
    {id: 'cta', beats: 8, Comp: FunnyCta},
  ],
};

const timeline = (cut: FunnyCut) => {
  let beat = 0;
  return STEPS[cut].map((s) => {
    const from = Math.round(beat * FBEAT);
    beat += s.beats;
    return {...s, from, duration: Math.round(beat * FBEAT) - from};
  });
};

export const funnyDuration = (cut: FunnyCut) => {
  const t = timeline(cut);
  return t[t.length - 1].from + t[t.length - 1].duration;
};

export const FunnyReel: React.FC<FunnyProps> = ({withMusic, cut, safe}) => {
  const scenes = timeline(cut);
  const total = funnyDuration(cut);
  const zone = SAFE_ZONES[safe];
  return (
    <CutContext.Provider value={cut}>
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
              {scenes.map(({id, duration, Comp}, i) => (
                <Series.Sequence key={id} durationInFrames={duration}>
                  <SceneFade duration={duration} fadeIn={i > 0 && !id.startsWith('s')} fadeOut={id === 'hook' || id === 'all' || id === 'occasions'}>
                    <Comp />
                  </SceneFade>
                </Series.Sequence>
              ))}
            </Series>
          </div>
        </AbsoluteFill>
      </SafeContext.Provider>
    </CutContext.Provider>
  );
};
