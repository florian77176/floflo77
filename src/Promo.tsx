import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {promo} from './config';
import {Background} from './components/Background';
import {CtaScene, HookScene, OfferScene, PrintScene, ReviewScene, TEMPLATE_DURATION, TemplatesScene, THEME_DURATION, ThemesScene} from './components/Scenes';
import {Logo, SceneFade} from './components/ui';

// Durées des scènes (30 images = 1 seconde)
const SCENES = {
  hook: 70,
  themes: THEME_DURATION * promo.themes.length + 15,
  templates: TEMPLATE_DURATION * promo.templates.length + 25,
  prints: 110,
  review: 110,
  offer: 100,
  cta: 150,
};
export const PROMO_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      <Series.Sequence durationInFrames={SCENES.hook}>
        <SceneFade duration={SCENES.hook}><HookScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.themes}>
        <SceneFade duration={SCENES.themes}><ThemesScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.templates}>
        <SceneFade duration={SCENES.templates}><TemplatesScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.prints}>
        <SceneFade duration={SCENES.prints}><PrintScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.review}>
        <SceneFade duration={SCENES.review}><ReviewScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.offer}>
        <SceneFade duration={SCENES.offer}><OfferScene /></SceneFade>
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
    <SceneFade duration={120}><Logo size={560} /></SceneFade>
  </AbsoluteFill>
);
