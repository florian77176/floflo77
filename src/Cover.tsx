import React from 'react';
import {AbsoluteFill} from 'remotion';
import {reel} from './config';
import {Background} from './components/Background';
import {RecapCell} from './components/Scenes';
import {Kicker, Logo, Title, useUnit} from './components/ui';

// Couverture du reel (image fixe). Tout tient dans le carré central 4:5,
// car Instagram recadre la couverture ainsi dans la grille du profil.
export const Cover: React.FC = () => {
  const {unit} = useUnit();
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * unit}}>
          <Kicker>✦ {reel.kicker} ✦</Kicker>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 24 * unit}}>
            <Title size={92}>{reel.hook[0]}</Title>
            <Title size={110} italic gold>
              {reel.hook[1]}
            </Title>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(2, ${360 * unit}px)`, gap: 26 * unit, marginTop: 10 * unit}}>
            {reel.templates.map((t, i) => (
              <RecapCell key={t.event} index={i} w={360} h={340} />
            ))}
          </div>
          <div style={{marginTop: 14 * unit}}>
            <Logo size={150} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
