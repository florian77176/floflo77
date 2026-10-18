import React from 'react';
import {Composition} from 'remotion';
import {LogoIntro, Promo, PROMO_DURATION} from './Promo';
import './fonts';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Reel Instagram / TikTok / Story */}
    <Composition id="Story" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1080} height={1920} />
    {/* Post Instagram / Facebook carré */}
    <Composition id="Post" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1080} height={1080} />
    {/* Intro logo 16:9 */}
    <Composition id="Intro" component={LogoIntro} durationInFrames={120} fps={30} width={1920} height={1080} />
  </>
);
