import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';

const {colors} = brand;

// Marges à laisser libres (en px) : zones recouvertes par l'interface de chaque réseau
// (boutons, légende, barre de profil…). Le contenu est centré et dimensionné dans la zone restante.
export type Safe = {top: number; right: number; bottom: number; left: number};
export const SAFE_ZONES: Record<string, Safe> = {
  none: {top: 0, right: 0, bottom: 0, left: 0},
  instagram: {top: 220, right: 110, bottom: 420, left: 110},
  tiktok: {top: 180, right: 130, bottom: 480, left: 130},
  snapchat: {top: 170, right: 110, bottom: 380, left: 110},
  story: {top: 250, right: 60, bottom: 330, left: 60},
  feed: {top: 40, right: 40, bottom: 40, left: 40},
  cover: {top: 330, right: 90, bottom: 330, left: 90},
  // zone commune Instagram + TikTok + Snapchat + Facebook : un seul fichier pour tous les réseaux
  universal: {top: 230, right: 140, bottom: 470, left: 90},
};
export const SafeContext = createContext<Safe>(SAFE_ZONES.none);

export const useUnit = () => {
  const {width, height} = useVideoConfig();
  const safe = useContext(SafeContext);
  const areaW = width - safe.left - safe.right;
  const areaH = height - safe.top - safe.bottom;
  // « vertical » = format téléphone 9:16 ; le 4:5 et le carré utilisent la mise en page compacte
  const vertical = height / width > 1.5;
  // En 9:16 on grossit de 20 % pour la lisibilité (référence : 1080 px de large sans marge),
  // en 4:5 de 10 % (un peu plus de hauteur que le carré)
  const boost = vertical ? 1.2 : height / width > 1.2 ? 1.1 : 1;
  return {unit: (Math.min(areaW, areaH) / 1080) * boost, vertical};
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
  // position fixe : le flash couvre tout l'écran, même si la scène est dans une zone réduite
  return <div style={{position: 'fixed', inset: 0, background: '#fff', opacity, pointerEvents: 'none'}} />;
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
