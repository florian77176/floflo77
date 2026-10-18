import React from 'react';
import {Composition} from 'remotion';
import {EVENT_DURATION, EventVideo, LogoIntro} from './EventVideo';
import './fonts';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Story / Reel / TikTok */}
    <Composition id="Story" component={EventVideo} durationInFrames={EVENT_DURATION} fps={30} width={1080} height={1920} />
    {/* Post Instagram / Facebook carré */}
    <Composition id="Post" component={EventVideo} durationInFrames={EVENT_DURATION} fps={30} width={1080} height={1080} />
    {/* Intro logo 16:9 (YouTube, écran, vidéo d'événement) */}
    <Composition id="Intro" component={LogoIntro} durationInFrames={150} fps={30} width={1920} height={1080} />
  </>
);
