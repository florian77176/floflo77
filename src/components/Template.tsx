import React from 'react';
import {Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';
import {useUnit} from './ui';

const {colors} = brand;

type Style = 'mariage' | 'anniversaire' | 'bapteme' | 'entreprise';

const STYLES: Record<Style, {bg: string; text: string; accent: string; stars?: boolean; ornament: string}> = {
  mariage: {bg: '#FAF7F0', text: '#2C2A28', accent: '#B8952C', ornament: '♥'},
  anniversaire: {bg: '#1E2F6B', text: '#FAF7F0', accent: '#E9C46A', stars: true, ornament: '★'},
  bapteme: {bg: '#DCE8E4', text: '#2F4A45', accent: '#8FB3A8', ornament: '✿'},
  entreprise: {bg: '#111111', text: '#FAF7F0', accent: colors.gold, ornament: '◆'},
};

// Cadre photobooth personnalisé (format tirage 3:2) : photo en haut, texte en bas.
// Le texte s'écrit lettre par lettre à partir de `typeFrom`.
export const Template: React.FC<{
  style: Style;
  title: string;
  subtitle: string;
  decor: string;
  width: number;
  typeFrom?: number;
}> = ({style, title, subtitle, decor, width, typeFrom = 0}) => {
  const frame = useCurrentFrame();
  const {unit} = useUnit();
  const st = STYLES[style];
  const w = width * unit;
  const h = (w * 2) / 3;
  const pad = w * 0.04;

  const typed = Math.max(0, Math.floor((frame - typeFrom) * 1.2));
  const titleShown = title.slice(0, typed);
  const subIn = interpolate(frame - typeFrom, [title.length / 1.2, title.length / 1.2 + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(frame, [0, 90], [1.1, 1.0], {extrapolateRight: 'clamp'});
  const cursor = typed < title.length && frame >= typeFrom && Math.floor(frame / 6) % 2 === 0;

  return (
    <div
      style={{
        width: w,
        height: h,
        background: st.bg,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 6 * unit,
        boxShadow: `0 ${30 * unit}px ${80 * unit}px rgba(0,0,0,0.6), 0 0 ${60 * unit}px ${colors.gold}33`,
        display: 'flex',
        flexDirection: 'column',
        padding: pad,
        boxSizing: 'border-box',
      }}
    >
      {st.stars &&
        new Array(40).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${random(`tx${i}`) * 100}%`,
              top: `${random(`ty${i}`) * 100}%`,
              fontSize: (6 + random(`ts${i}`) * 10) * unit,
              color: st.accent,
              opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 8 + i)),
            }}
          >
            ★
          </div>
        ))}
      <div style={{flex: 1, overflow: 'hidden', borderRadius: 3 * unit, position: 'relative', border: `${3 * unit}px solid ${st.accent}`}}>
        <Img src={staticFile(decor)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
      </div>
      <div
        style={{
          height: h * 0.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          padding: `0 ${pad * 0.5}px`,
        }}
      >
        <div style={{color: st.accent, fontSize: h * 0.07}}>{st.ornament}</div>
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: h * 0.115,
              color: st.text,
              lineHeight: 1.1,
              minHeight: h * 0.12,
            }}
          >
            {titleShown}
            <span style={{opacity: cursor ? 1 : 0, color: st.accent}}>|</span>
          </div>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 600,
              fontSize: h * 0.045,
              letterSpacing: h * 0.006,
              textTransform: 'uppercase',
              color: st.accent,
              opacity: subIn,
            }}
          >
            {subtitle}
          </div>
        </div>
        <div style={{color: st.accent, fontSize: h * 0.07}}>{st.ornament}</div>
      </div>
    </div>
  );
};
