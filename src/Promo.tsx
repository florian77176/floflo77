import React from 'react';
import {AbsoluteFill, Audio, interpolate, Series, staticFile} from 'remotion';
import {promo} from './config';
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

// Durées des scènes (30 images = 1 seconde). La musique (120 BPM) démarre son rythme à 2 s.
const SCENES = {
  hook: 60,
  countdown: 60,
  templates: TEMPLATE_DURATION * promo.templates.length + 20,
  prints: 105,
  included: 120,
  formulas: 120,
  review: 100,
  cta: 165,
};
export const PROMO_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Audio
      src={staticFile('audio/music.wav')}
      volume={(f) => interpolate(f, [0, 10], [0, 0.55], {extrapolateRight: 'clamp'})}
    />
    <Series>
      <Series.Sequence durationInFrames={SCENES.hook}>
        <SceneFade duration={SCENES.hook}><HookScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.countdown}>
        <SceneFade duration={SCENES.countdown}><CountdownScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.templates}>
        <SceneFade duration={SCENES.templates}><TemplatesScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.prints}>
        <SceneFade duration={SCENES.prints}><PrintScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.included}>
        <SceneFade duration={SCENES.included}><IncludedScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.formulas}>
        <SceneFade duration={SCENES.formulas}><FormulasScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.review}>
        <SceneFade duration={SCENES.review}><ReviewScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.cta}>
        <SceneFade duration={SCENES.cta} fadeOut={false}><CtaScene /></SceneFade>
      </Series.Sequence>
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
