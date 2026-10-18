import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useUnit} from '../components/ui';
import {funny, funnyText, structures} from './config';
import {BigText, FunnyBackground, InflatableSticker, NumBadge} from './parts';

// Couverture du reel : la question + les 4 structures numérotées (dans la zone 4:5 du profil Instagram)
export const FunnyCover: React.FC = () => {
  const {unit} = useUnit();
  return (
    <AbsoluteFill>
      <FunnyBackground />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * unit}}>
          <BigText size={110}>{`${funnyText.hook[0]} ${funnyText.hook[1]}`}</BigText>
          <BigText size={84} color={funny.colors.red} rotate={-3}>
            {funnyText.hook[2]}
          </BigText>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(2, ${380 * unit}px)`, gap: 20 * unit, marginTop: 20 * unit}}>
            {structures.map((s, i) => (
              <div key={s.name} style={{position: 'relative', height: 330 * unit, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                <InflatableSticker src={s.image} ratio={s.ratio} maxW={350} maxH={300} at={-200} />
                <div style={{position: 'absolute', top: 0, left: 0}}>
                  <NumBadge n={i + 1} size={76} at={-200} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
