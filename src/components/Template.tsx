import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {brand} from '../config';
import {sans, serif} from '../fonts';
import {useUnit} from './ui';

const {colors} = brand;

export type TemplateStyle = 'mariage' | 'anniversaire' | 'bapteme' | 'babyshower' | 'entreprise';
export type TemplateLayout = 'strip' | 'grid' | 'single' | 'duo' | 'logo';

// photo / guests : couleur nette de la photo « prise » et des silhouettes
const STYLES: Record<TemplateStyle, {bg: string; text: string; accent: string; slot: string; photo: string; guests: string; stars?: boolean; ornament: string}> = {
  mariage: {bg: '#FAF7F0', text: '#2C2A28', accent: '#B8952C', slot: '#EFE6D2', photo: '#E4CF9C', guests: '#FFFFFF', ornament: '♥'},
  anniversaire: {bg: '#1E2F6B', text: '#FAF7F0', accent: '#E9C46A', slot: '#2A3E82', photo: '#4467D1', guests: '#E9C46A', stars: true, ornament: '★'},
  bapteme: {bg: '#E3EEEA', text: '#2F4A45', accent: '#7FA89B', slot: '#CFE0DA', photo: '#A9CBBF', guests: '#FFFFFF', ornament: '✿'},
  babyshower: {bg: '#FBE7EC', text: '#6B3A4A', accent: '#D98AA0', slot: '#F5D3DC', photo: '#EFA9BC', guests: '#FFFFFF', ornament: '♡'},
  entreprise: {bg: '#111111', text: '#FAF7F0', accent: colors.gold, slot: '#1F1F1F', photo: '#4A3F22', guests: colors.gold, ornament: '◆'},
};

// Proportions de chaque format de tirage (largeur / hauteur)
export const LAYOUT_RATIO: Record<TemplateLayout, number> = {
  strip: 1 / 3,
  grid: 2 / 3,
  single: 2 / 3,
  duo: 3 / 2,
  logo: 3 / 2,
};

const SLOTS: Record<TemplateLayout, number> = {strip: 3, grid: 4, single: 1, duo: 2, logo: 1};

// Silhouettes génériques (pas de vraies personnes) : aident à imaginer la photo
const Guests: React.FC<{color: string}> = ({color}) => (
  <svg viewBox="0 0 120 60" style={{position: 'absolute', bottom: 0, left: '10%', width: '80%'}} preserveAspectRatio="xMidYMax meet">
    {[
      [30, 22, 11],
      [60, 18, 13],
      [90, 22, 11],
    ].map(([cx, cy, r], i) => (
      <g key={i} fill={color}>
        <circle cx={cx} cy={cy} r={r * 0.62} />
        <path d={`M${cx - r * 1.35} 60 Q${cx - r * 1.35} ${cy + r * 0.85} ${cx} ${cy + r * 0.85} Q${cx + r * 1.35} ${cy + r * 0.85} ${cx + r * 1.35} 60 Z`} />
      </g>
    ))}
  </svg>
);

const CameraIcon: React.FC<{color: string; size: number}> = ({color, size}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

// Emplacement photo : vide (pointillés + appareil photo), puis « photo prise » avec flash
const Slot: React.FC<{st: (typeof STYLES)[TemplateStyle]; index: number; captureAt: number; unitPx: number}> = ({st, index, captureAt, unitPx}) => {
  const frame = useCurrentFrame();
  const local = frame - captureAt;
  const taken = local >= 0;
  const flash = interpolate(local, [0, 2, 12], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const reveal = interpolate(local, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
        borderRadius: 4 * unitPx,
        overflow: 'hidden',
        background: st.slot,
        border: `${2 * unitPx}px dashed ${st.accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 6 * unitPx,
      }}
    >
      <div style={{opacity: 1 - reveal, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * unitPx}}>
        <CameraIcon color={st.accent} size={34 * unitPx} />
        <div style={{fontFamily: sans, fontWeight: 600, fontSize: 13 * unitPx, letterSpacing: 2 * unitPx, textTransform: 'uppercase', color: st.accent}}>
          Photo {index + 1}
        </div>
      </div>
      {taken && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: reveal,
            // aplat net (pas de dégradé flou, qui ressemble à une photo floue et se compresse mal)
            background: st.photo,
          }}
        >
          <Guests color={st.guests} />
        </div>
      )}
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
    </div>
  );
};

// Cadre photobooth personnalisé. Les photos « se prennent » une à une à partir de `shootFrom`,
// puis le titre s'écrit lettre par lettre.
export const Template: React.FC<{
  style: TemplateStyle;
  layout: TemplateLayout;
  title: string;
  subtitle: string;
  height: number; // hauteur en unités (1080 = hauteur de référence)
  shootFrom?: number;
  shootEvery?: number;
}> = ({style, layout, title, subtitle, height, shootFrom = 0, shootEvery = 8}) => {
  const frame = useCurrentFrame();
  const {unit} = useUnit();
  const st = STYLES[style];
  const H = height * unit;
  const W = H * LAYOUT_RATIO[layout];
  const base = Math.min(W, H); // taille de référence pour les textes
  const u = base / 400; // unité interne du cadre
  const pad = base * 0.05;
  const n = SLOTS[layout];

  const typeFrom = shootFrom + n * shootEvery + 4;
  const typed = Math.max(0, Math.floor((frame - typeFrom) * 1.4));
  const subIn = interpolate(frame - typeFrom, [title.length / 1.4, title.length / 1.4 + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursor = typed < title.length && frame >= typeFrom && Math.floor(frame / 5) % 2 === 0;

  const slots = new Array(n).fill(0).map((_, i) => <Slot key={i} st={st} index={i} captureAt={shootFrom + i * shootEvery} unitPx={u} />);

  const grid =
    layout === 'grid' ? (
      <div style={{flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: pad * 0.6, minHeight: 0}}>{slots}</div>
    ) : layout === 'duo' ? (
      <div style={{flex: 1, display: 'flex', gap: pad * 0.6, minHeight: 0}}>{slots}</div>
    ) : (
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: pad * 0.6, minHeight: 0}}>{slots}</div>
    );

  const footerH = layout === 'strip' ? H * 0.16 : layout === 'duo' || layout === 'logo' ? H * 0.24 : H * 0.18;
  const titleSize = layout === 'strip' ? W * 0.13 : base * 0.085;

  return (
    <div
      style={{
        width: W,
        height: H,
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
        new Array(36).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${random(`tx${i}`) * 100}%`,
              top: `${random(`ty${i}`) * 100}%`,
              fontSize: (5 + random(`ts${i}`) * 9) * u,
              color: st.accent,
              opacity: 0.35 + 0.65 * Math.abs(Math.sin(frame / 8 + i)),
            }}
          >
            ★
          </div>
        ))}
      {grid}
      <div
        style={{
          height: footerH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: base * 0.04,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {layout === 'logo' && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              border: `${1.5 * u}px dashed ${st.accent}`,
              borderRadius: 4 * u,
              padding: `${6 * u}px ${10 * u}px`,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: base * 0.035,
              color: st.accent,
              letterSpacing: 1.5 * u,
            }}
          >
            VOTRE LOGO
          </div>
        )}
        {layout !== 'strip' && layout !== 'logo' && <div style={{color: st.accent, fontSize: base * 0.06}}>{st.ornament}</div>}
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: titleSize, color: st.text, lineHeight: 1.05, minHeight: titleSize * 1.05, whiteSpace: 'nowrap'}}>
            {title.slice(0, typed)}
            <span style={{opacity: cursor ? 1 : 0, color: st.accent}}>|</span>
          </div>
          <div
            style={{
              fontFamily: sans,
              fontWeight: 600,
              fontSize: titleSize * 0.38,
              letterSpacing: titleSize * 0.05,
              textTransform: 'uppercase',
              color: st.accent,
              opacity: subIn,
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        </div>
        {layout !== 'strip' && layout !== 'logo' && <div style={{color: st.accent, fontSize: base * 0.06}}>{st.ornament}</div>}
      </div>
    </div>
  );
};
