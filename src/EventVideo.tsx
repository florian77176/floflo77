import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {Background} from './components/Background';
import {CtaScene, InfoScene, IntroScene, SceneFade, TitleScene} from './components/Scenes';

// Durées des scènes (en images, 30 images = 1 seconde)
export const SCENES = {intro: 75, title: 120, info: 105, cta: 120};
export const EVENT_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const EventVideo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      <Series.Sequence durationInFrames={SCENES.intro}>
        <SceneFade duration={SCENES.intro}><IntroScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.title}>
        <SceneFade duration={SCENES.title}><TitleScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.info}>
        <SceneFade duration={SCENES.info}><InfoScene /></SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENES.cta}>
        <SceneFade duration={SCENES.cta}><CtaScene /></SceneFade>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);

// Intro logo courte (pour YouTube, écran géant, début de vidéo)
export const LogoIntro: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <SceneFade duration={150}><IntroScene /></SceneFade>
  </AbsoluteFill>
);
