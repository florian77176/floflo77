import React from 'react';
import {Composition} from 'remotion';
import {LogoIntro, Reel, ReelProps, reelDuration} from './Reel';
import './fonts';

const reelComp = (id: string, props: ReelProps, width: number, height: number) => (
  <Composition
    id={id}
    component={Reel}
    defaultProps={props}
    durationInFrames={reelDuration(props.withVoice)}
    fps={30}
    width={width}
    height={height}
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    {/* Reel Instagram / TikTok — version principale : musique, sans voix */}
    {reelComp('Reel', {withMusic: true, withVoice: false}, 1080, 1920)}
    {/* Sans musique : pour ajouter un son tendance directement dans Instagram / TikTok */}
    {reelComp('ReelSansMusique', {withMusic: false, withVoice: false}, 1080, 1920)}
    {/* Avec voix d'homme (optionnelle) */}
    {reelComp('ReelVoix', {withMusic: true, withVoice: true}, 1080, 1920)}
    {/* Post carré Instagram / Facebook */}
    {reelComp('Post', {withMusic: true, withVoice: false}, 1080, 1080)}
    {/* Intro logo 16:9 */}
    <Composition id="Intro" component={LogoIntro} durationInFrames={120} fps={30} width={1920} height={1080} />
  </>
);
