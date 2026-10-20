import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, Series, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rounded} from '../fonts';
import {SAFE_ZONES, SafeContext, useUnit} from '../components/ui';
import {funny} from './config';
import durations from './footage-durations.json';
import {Caption} from './promo';
import {Pill} from './parts';

const {colors} = funny;
const FPS = 30;
type ClipId = keyof typeof durations;

// ─── Description d'un épisode de la série (voir src/funny/episodes.ts) ────────────────
export type Sfx = {name: string; at?: number; vol?: number}; // at en secondes depuis le début du plan
export type Shot = {
  clip: ClipId; // extrait dans public/funny/footage/ (tools/build_clips.py)
  beats: number; // durée en temps musicaux : toutes les coupes tombent sur le rythme
  center?: string[]; // gros texte centré (accroche), une ligne par élément
  centerColor?: string; // couleur de la 2e ligne
  top?: string; // petit texte au-dessus du gros texte
  big?: string; // gros texte en haut
  num?: number; // numéro du Top (pastille)
  name?: string; // nom de la structure
  price?: string; // pastille rouge
  info?: string; // pastille blanche
  counter?: [number, number]; // chrono affiché (secondes) du début à la fin du plan
  sfx?: Sfx[];
};
export type Episode = {
  id: string;
  music: {file: string; start: number; beat: number};
  shots: Shot[];
  end: {clip: ClipId; question: string; line: string; beats: number};
  credit: string;
};

export const episodeDuration = (ep: Episode) => {
  const total = ep.shots.reduce((a, s) => a + s.beats, 0) + ep.end.beats;
  return Math.round(total * ep.music.beat * FPS);
};

// Extrait plein écran : « punch-in » sur la coupe, vitesse ajustée si l'extrait est trop court
const Footage: React.FC<{clip: ClipId; frames: number; dim?: number}> = ({clip, frames, dim = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const need = frames / FPS;
  const have = durations[clip];
  const rate = have < need ? have / need : 1; // jamais d'image figée en fin de plan
  const punch = interpolate(spring({frame, fps, config: {damping: 18, stiffness: 260}}), [0, 1], [1.14, 1]);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${punch})`}}>
        <OffthreadVideo src={staticFile(`funny/footage/${clip}.mp4`)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {/* lisibilité des textes en haut et en bas */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.5) 100%)'}} />
      {dim > 0 && <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} />}
    </AbsoluteFill>
  );
};

const usePop = (at = 0, stiffness = 240) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping: 12, stiffness}});
};

const NumBadge: React.FC<{n: number; animate: boolean}> = ({n, animate}) => {
  const {unit} = useUnit();
  const p = usePop(0, 260);
  const s = animate ? p : 1;
  return (
    <div
      style={{
        width: 150 * unit,
        height: 150 * unit,
        borderRadius: '50%',
        background: colors.red,
        border: `${7 * unit}px solid #fff`,
        boxShadow: `0 ${8 * unit}px 0 rgba(0,0,0,0.3)`,
        color: '#fff',
        fontFamily: rounded,
        fontWeight: 800,
        fontSize: 100 * unit,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10 * unit,
        boxSizing: 'border-box',
        transform: `scale(${s}) rotate(${(1 - s) * -90 - 6}deg)`,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
};

const Counter: React.FC<{from: number; to: number; frames: number}> = ({from, to, frames}) => {
  const frame = useCurrentFrame();
  const sec = Math.floor(interpolate(frame, [0, frames - 4], [from, to], {extrapolateRight: 'clamp'}));
  const txt = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <Pill size={64} bg={colors.dark} color={colors.yellow}>
      ⏱️ {txt}
    </Pill>
  );
};

// Textes d'un plan, placés dans la zone visible commune à tous les réseaux
const ShotOverlay: React.FC<{shot: Shot; prev?: Shot; frames: number}> = ({shot, prev, frames}) => {
  const {unit} = useUnit();
  const sameItem = !!prev && prev.name !== undefined && prev.name === shot.name; // même structure : pas de nouvelle animation
  return (
    <AbsoluteFill style={{justifyContent: shot.center ? 'center' : 'space-between', alignItems: 'center'}}>
      {shot.center ? (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * unit}}>
          {shot.top && <Caption size={64}>{shot.top}</Caption>}
          {shot.center.map((l, i) => (
            <Caption key={l} size={i === 0 ? 108 : i === 1 ? 128 : 76} color={i === 1 ? shot.centerColor ?? colors.yellow : '#fff'} at={i * 5} maxWidth={820}>
              {l}
            </Caption>
          ))}
        </div>
      ) : (
        <>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * unit}}>
            {shot.top && <Caption size={58}>{shot.top}</Caption>}
            {shot.big && (
              <Caption size={96} color={colors.yellow} maxWidth={820}>
                {shot.big}
              </Caption>
            )}
            {shot.counter && <Counter from={shot.counter[0]} to={shot.counter[1]} frames={frames} />}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 * unit, width: '100%'}}>
            {shot.num !== undefined && (
              <div style={{display: 'flex', alignItems: 'center', gap: 18 * unit}}>
                <NumBadge n={shot.num} animate={!sameItem} />
                {shot.name && <Pill size={54} bg={colors.dark} at={sameItem ? undefined : 4}>{shot.name}</Pill>}
              </div>
            )}
            {shot.num === undefined && shot.name && <Pill size={54} bg={colors.dark} at={sameItem ? undefined : 4}>{shot.name}</Pill>}
            <div style={{display: 'flex', gap: 14 * unit, flexWrap: 'wrap'}}>
              {shot.price && <Pill size={50} at={sameItem ? undefined : 8} rotate={-3}>{shot.price}</Pill>}
              {shot.info && <Pill size={42} bg="#fff" color={colors.dark} at={sameItem ? undefined : 11} rotate={2}>{shot.info}</Pill>}
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// Écran final : question (commentaires), mot-clé local (référencement), contact
const EndCard: React.FC<{ep: Episode; frames: number}> = ({ep, frames}) => {
  const {unit} = useUnit();
  const frame = useCurrentFrame();
  const logo = usePop(0, 160);
  const q = usePop(6, 200);
  const pulse = 1 + Math.sin(frame / 5) * 0.025;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * unit}}>
        <Img src={staticFile(funny.logo)} style={{width: 430 * unit, transform: `scale(${logo})`, filter: `drop-shadow(0 ${8 * unit}px ${14 * unit}px rgba(0,0,0,0.4))`}} />
        <div style={{transform: `scale(${q * pulse}) rotate(-2deg)`}}>
          <Pill size={62} bg={colors.yellow} color={colors.dark}>
            {ep.end.question}
          </Pill>
        </div>
        <Caption size={46} at={10} maxWidth={820}>
          {ep.end.line}
        </Caption>
        <Caption size={66} color={colors.yellow} at={14}>
          {funny.site}
        </Caption>
        <Caption size={54} at={18}>
          📞 {funny.phone}
        </Caption>
        <Pill size={38} bg="#fff" color={colors.dark} at={22}>
          ✓ Devis gratuit en 24h · 📍 77 & Île-de-France
        </Pill>
      </div>
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontFamily: rounded, fontSize: 18 * unit, color: 'rgba(255,255,255,0.6)'}}>
        {ep.credit}
      </div>
    </AbsoluteFill>
  );
};

const SfxAt: React.FC<{s: Sfx}> = ({s}) => (
  <Sequence from={Math.round((s.at ?? 0) * FPS)} layout="none">
    <Audio src={staticFile(`audio/sfx-${s.name}.wav`)} volume={(s.vol ?? 0.7) * 0.6} />
  </Sequence>
);

export type SeriesProps = {episode: Episode; safe: keyof typeof SAFE_ZONES};

export const SeriesVideo: React.FC<SeriesProps> = ({episode: ep, safe}) => {
  const zone = SAFE_ZONES[safe];
  const total = episodeDuration(ep);
  const bf = ep.music.beat * FPS;
  // positions (en images) de chaque plan, arrondies sur la grille des temps
  let acc = 0;
  const plan = ep.shots.map((s) => {
    const from = Math.round(acc * bf);
    acc += s.beats;
    return {s, from, frames: Math.round(acc * bf) - from};
  });
  const endFrom = Math.round(acc * bf);
  const zoneStyle: React.CSSProperties = {position: 'absolute', top: zone.top, right: zone.right, bottom: zone.bottom, left: zone.left};
  return (
    <SafeContext.Provider value={zone}>
      <AbsoluteFill style={{background: '#000'}}>
        <Audio
          src={staticFile(ep.music.file)}
          trimBefore={Math.round(ep.music.start * FPS)}
          volume={(f) => 0.75 * interpolate(f, [total - 24, total], [1, 0], {extrapolateLeft: 'clamp'})}
        />
        <Series>
          {plan.map(({s, frames}, i) => (
            <Series.Sequence key={i} durationInFrames={frames}>
              <Footage clip={s.clip} frames={frames} />
              {i > 0 && <SfxAt s={{name: 'whoosh', vol: 0.35}} />}
              {(s.sfx ?? []).map((x, k) => (
                <SfxAt key={k} s={x} />
              ))}
              <div style={zoneStyle}>
                <ShotOverlay shot={s} prev={plan[i - 1]?.s} frames={frames} />
              </div>
            </Series.Sequence>
          ))}
          <Series.Sequence durationInFrames={total - endFrom}>
            <Footage clip={ep.end.clip} frames={total - endFrom} dim={0.5} />
            <SfxAt s={{name: 'boing', vol: 0.5}} />
            <SfxAt s={{name: 'ding', at: 0.4, vol: 0.5}} />
            <div style={zoneStyle}>
              <EndCard ep={ep} frames={total - endFrom} />
            </div>
          </Series.Sequence>
        </Series>
      </AbsoluteFill>
    </SafeContext.Provider>
  );
};
