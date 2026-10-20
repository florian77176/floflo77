import React from 'react';
import {Composition} from 'remotion';
import {Cover} from './Cover';
import {LogoIntro, Reel, ReelProps, reelDuration} from './Reel';
import {FunnyPromo, PromoProps, promoDuration} from './funny/promo';
import {EPISODES} from './funny/episodes';
import {episodeDuration, SeriesVideo} from './funny/series';
import './fonts';

const reelComp = (id: string, props: ReelProps, width = 1080, height = 1920) => (
  <Composition
    id={id}
    component={Reel}
    defaultProps={props}
    durationInFrames={reelDuration(props.withVoice, props.cut)}
    fps={30}
    width={width}
    height={height}
  />
);

const funnyComp = (id: string, props: PromoProps, width = 1080, height = 1920) => (
  <Composition id={id} component={FunnyPromo} defaultProps={props} durationInFrames={promoDuration(props.cut)} fps={30} width={width} height={height} />
);

const full = {withMusic: true, withVoice: false, cut: 'full'} as const;
const story = {withMusic: true, withVoice: false, cut: 'story'} as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* Instagram (et Facebook) */}
    {reelComp('Instagram-Reel', {...full, safe: 'instagram'})}
    {reelComp('Instagram-Reel-SansMusique', {...full, withMusic: false, safe: 'instagram'})}
    {reelComp('Instagram-Story', {...story, safe: 'story'})}
    {reelComp('Feed-4x5', {...full, safe: 'feed'}, 1080, 1350)}
    {/* TikTok */}
    {reelComp('TikTok', {...full, safe: 'tiktok'})}
    {reelComp('TikTok-SansMusique', {...full, withMusic: false, safe: 'tiktok'})}
    {/* Snapchat */}
    {reelComp('Snapchat-Spotlight', {...full, safe: 'snapchat'})}
    {reelComp('Snapchat-Story', {...story, safe: 'snapchat'})}
    {/* Bonus */}
    {reelComp('Reel-VoixHomme', {...full, withVoice: true, safe: 'instagram'})}
    <Composition id="Cover" component={Cover} durationInFrames={90} fps={30} width={1080} height={1920} />
    {/* ─── Funny Loisirs ─── */}
    {funnyComp('Funny-Instagram-Reel', {withMusic: true, cut: 'full', safe: 'instagram'})}
    {funnyComp('Funny-Instagram-Reel-SansMusique', {withMusic: false, cut: 'full', safe: 'instagram'})}
    {funnyComp('Funny-Instagram-Story', {withMusic: true, cut: 'story', safe: 'story'})}
    {funnyComp('Funny-Feed-4x5', {withMusic: true, cut: 'full', safe: 'feed'}, 1080, 1350)}
    {funnyComp('Funny-TikTok', {withMusic: true, cut: 'full', safe: 'tiktok'})}
    {funnyComp('Funny-TikTok-SansMusique', {withMusic: false, cut: 'full', safe: 'tiktok'})}
    {funnyComp('Funny-Snapchat-Spotlight', {withMusic: true, cut: 'full', safe: 'snapchat'})}
    {funnyComp('Funny-Snapchat-Story', {withMusic: true, cut: 'story', safe: 'snapchat'})}
    {/* couverture : 1re scène, texte resserré dans la zone 4:5 visible sur la grille du profil */}
    {funnyComp('Funny-Cover', {withMusic: false, cut: 'full', safe: 'cover'})}
    {/* ─── Funny Loisirs : série (un fichier 9:16 pour tous les réseaux) ─── */}
    {EPISODES.map((ep) => (
      <Composition key={ep.id} id={`Serie-${ep.id}`} component={SeriesVideo} defaultProps={{episode: ep, safe: 'universal' as const}} durationInFrames={episodeDuration(ep)} fps={30} width={1080} height={1920} />
    ))}
    <Composition id="Intro" component={LogoIntro} durationInFrames={120} fps={30} width={1920} height={1080} />
  </>
);
