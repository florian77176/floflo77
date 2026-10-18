import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';

const {colors} = brand;

export const useUnit = () => {
  const {width, height} = useVideoConfig();
  const vertical = height > width;
  // En vertical (téléphone) on grossit tout de 20 % pour la lisibilité
  return {unit: (Math.min(width, height) / 1080) * (vertical ? 1.2 : 1), vertical};
};

export const goldGradient = `linear-gradient(100deg, ${colors.goldDark} 0%, ${colors.goldLight} 45%, ${colors.gold} 70%, ${colors.goldDark} 100%)`;

// Fondu d'entrée/sortie commun à chaque scène
// (fadeIn={false} pour la 1re scène : la toute première image doit déjà être lisible, c'est l'aperçu du reel)
export const SceneFade: React.FC<{children: React.ReactNode; duration: number; fadeIn?: boolean; fadeOut?: boolean}> = ({
  children,
  duration,
  fadeIn = true,
  fadeOut = true,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, duration - 8, duration], [fadeIn ? 0 : 1, 1, 1, fadeOut ? 0 : 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity, justifyContent: 'center', alignItems: 'center'}}>{children}</AbsoluteFill>;
};

// Flash blanc façon appareil photo
export const Flash: React.FC<{at?: number; strength?: number}> = ({at = 0, strength = 0.9}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - at, [0, 2, 12], [0, strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#fff', opacity, pointerEvents: 'none'}} />;
};

// Texte révélé de bas en haut derrière un masque
export const Reveal: React.FC<{children: React.ReactNode; delay?: number}> = ({children, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 22});
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.08em'}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

export const Title: React.FC<{children: React.ReactNode; size?: number; italic?: boolean; gold?: boolean}> = ({
  children,
  size = 96,
  italic = false,
  gold = false,
}) => {
  const {unit} = useUnit();
  return (
    <div
      style={{
        fontFamily: italic ? serif : sans,
        fontStyle: italic ? 'italic' : 'normal',
        fontWeight: italic ? 600 : 800,
        fontSize: size * unit,
        lineHeight: 1.1,
        textAlign: 'center',
        color: gold ? 'transparent' : colors.cream,
        backgroundImage: gold ? goldGradient : undefined,
        WebkitBackgroundClip: gold ? 'text' : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {unit} = useUnit();
  return (
    <div
      style={{
        fontFamily: sans,
        fontWeight: 600,
        fontSize: 30 * unit,
        letterSpacing: 8 * unit,
        textTransform: 'uppercase',
        color: colors.gold,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
};

export const Logo: React.FC<{size: number; delay?: number}> = ({size, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {unit} = useUnit();
  const s = spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 90}});
  const shine = interpolate(frame - delay, [15, 45], [-40, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        width: size * unit,
        height: size * unit,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`,
        boxShadow: `0 0 ${80 * unit}px ${colors.gold}55`,
      }}
    >
      <Img src={staticFile(brand.logo)} style={{width: '100%', height: '100%'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(110deg, transparent ${shine - 15}%, rgba(255,240,200,0.45) ${shine}%, transparent ${shine + 15}%)`,
        }}
      />
    </div>
  );
};
