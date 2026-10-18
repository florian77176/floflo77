import React, {useContext} from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {rounded} from '../fonts';
import {CutContext, Sfx} from '../components/Scenes';
import {useUnit} from '../components/ui';
import {funny, funnyMusicCredit, funnyText, structures} from './config';
import {BigText, ConfettiBurst, FBEAT, InflatableSticker, NumBadge, Pill, StarBadge, usePopAt} from './parts';

const {colors} = funny;

const Col: React.FC<{children: React.ReactNode; gap: number}> = ({children, gap}) => {
  const {unit} = useUnit();
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: gap * unit}}>{children}</div>;
};

// 1. Accroche, lisible dès la 1re image
export const FunnyHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {vertical} = useUnit();
  const settle = interpolate(frame, [0, 10], [1.08, 1], {extrapolateRight: 'clamp'});
  const bounce = 1 + 0.04 * Math.exp(-(frame % FBEAT) / 4);
  return (
    <Col gap={26}>
      <Sfx name="boing" at={FBEAT} volume={0.6} />
      <div style={{transform: `scale(${settle})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <BigText size={vertical ? 140 : 110}>{funnyText.hook[0]}</BigText>
        <BigText size={vertical ? 140 : 110}>{funnyText.hook[1]}</BigText>
      </div>
      <div style={{transform: `scale(${settle * bounce})`}}>
        <BigText size={vertical ? 96 : 80} color={colors.red} rotate={-3}>
          {funnyText.hook[2]}
        </BigText>
      </div>
      <Pill size={vertical ? 52 : 46} bg={colors.dark} at={FBEAT}>
        {funnyText.hookSub}
      </Pill>
    </Col>
  );
};

// 2. Une structure : elle se gonfle, confettis, badge, prix… puis se dégonfle
export const makeStructureScene = (index: number): React.FC => () => {
  const {durationInFrames} = useVideoConfig();
  const {unit, vertical} = useUnit();
  const st = structures[index];
  const maxW = vertical ? 800 : 720;
  const maxH = vertical ? 900 : 600;
  const inflateAt = 4;
  const full = inflateAt + 16;
  return (
    <Col gap={vertical ? 34 : 18}>
      <Sfx name="inflate" at={inflateAt} volume={0.7} />
      <Sfx name="boing" at={full} volume={0.6} />
      <Sfx name="confetti" at={full} volume={0.7} />
      <Sfx name="pop" at={2 * FBEAT} volume={0.6} />
      <div style={{display: 'flex', alignItems: 'center', gap: 20 * unit}}>
        <NumBadge n={index + 1} size={vertical ? 120 : 96} />
        <BigText size={vertical ? 84 : 66} at={3}>
          {st.name}
        </BigText>
      </div>
      <div style={{position: 'relative', height: maxH * unit, width: maxW * unit, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <InflatableSticker src={st.image} ratio={st.ratio} maxW={maxW} maxH={maxH} at={inflateAt} deflateAt={durationInFrames - 8} />
        <ConfettiBurst at={full} />
        {st.badge && (
          <div style={{position: 'absolute', top: -10 * unit, right: -10 * unit}}>
            <StarBadge text={st.badge} size={vertical ? 190 : 160} at={full + 4} />
          </div>
        )}
      </div>
      <Pill size={vertical ? 64 : 54} at={2 * FBEAT} rotate={-3}>
        {st.price}
      </Pill>
    </Col>
  );
};

// 3. La chute : les 4 ensemble + « Ou… les 4 ? » + appel aux commentaires (ou au sondage en story)
export const FunnyAllFour: React.FC = () => {
  const {unit, vertical} = useUnit();
  const story = useContext(CutContext) === 'story';
  const cellW = vertical ? 420 : 400;
  const cellH = vertical ? (story ? 330 : 380) : 300;
  return (
    <Col gap={vertical ? 26 : 14}>
      <BigText size={vertical ? 100 : 84} color={colors.red} at={2 * FBEAT} rotate={-3}>
        {funnyText.allFour}
      </BigText>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(2, ${cellW * unit}px)`, gap: 22 * unit}}>
        {structures.map((s, i) => (
          <div key={s.name} style={{position: 'relative', height: cellH * unit, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
            <Sfx name="inflate" at={(i * FBEAT) / 2} volume={0.35} />
            <InflatableSticker src={s.image} ratio={s.ratio} maxW={cellW - 30} maxH={cellH - 30} at={(i * FBEAT) / 2} />
            <div style={{position: 'absolute', top: 0, left: 0}}>
              <NumBadge n={i + 1} size={vertical ? 80 : 70} at={(i * FBEAT) / 2 + 8} />
            </div>
          </div>
        ))}
      </div>
      <Sfx name="confetti" at={2 * FBEAT} volume={0.7} />
      <Sfx name="boing" at={2 * FBEAT} volume={0.5} />
      <Pill size={vertical ? 52 : 44} bg={colors.dark} at={3 * FBEAT}>
        {story ? funnyText.storyComment : funnyText.comment}
      </Pill>
      {story && <div style={{height: 210 * unit}} />}
      <div style={{position: 'absolute', inset: 0}}>
        <ConfettiBurst at={2 * FBEAT} count={60} spread={1.4} />
      </div>
    </Col>
  );
};

// 4. Les occasions
export const FunnyOccasions: React.FC = () => {
  const {unit, vertical} = useUnit();
  return (
    <Col gap={vertical ? 30 : 18}>
      <BigText size={vertical ? 84 : 70}>{funnyText.occasionsTitle}</BigText>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 * unit, maxWidth: (vertical ? 860 : 900) * unit}}>
        {funnyText.occasions.map((o, i) => (
          <React.Fragment key={o}>
            <Sfx name="pop" at={6 + (i * FBEAT) / 2} volume={0.5} />
            <Pill size={vertical ? 46 : 40} bg={i % 2 ? colors.red : colors.dark} at={6 + (i * FBEAT) / 2} rotate={i % 2 ? 2 : -2}>
              {o}
            </Pill>
          </React.Fragment>
        ))}
      </div>
      <BigText size={vertical ? 46 : 40} color={colors.red} at={4 * FBEAT}>
        {funnyText.more}
      </BigText>
    </Col>
  );
};

// 5. Appel à l'action
export const FunnyCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {unit, vertical} = useUnit();
  const logo = usePopAt(0, 160, 9);
  const btn = usePopAt(3 * FBEAT, 160);
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <>
      <Col gap={vertical ? 24 : 14}>
        <Sfx name="boing" volume={0.6} />
        <Sfx name="confetti" at={3 * FBEAT} volume={0.6} />
        <Sfx name="ding" at={3 * FBEAT} volume={0.5} />
        <Img
          src={staticFile(funny.logo)}
          style={{width: (vertical ? 520 : 330) * unit, transform: `scale(${logo}) rotate(${(1 - logo) * -30}deg)`, filter: `drop-shadow(0 ${10 * unit}px ${16 * unit}px rgba(0,0,0,0.25))`}}
        />
        <BigText size={vertical ? 50 : 42} at={FBEAT}>
          <span style={{color: colors.orange}}>★★★★★</span> {funnyText.reviews}
        </BigText>
        <div style={{display: 'flex', gap: 16 * unit, flexWrap: 'wrap', justifyContent: 'center'}}>
          {funnyText.perks.map((p, i) => (
            <Pill key={p} size={vertical ? 36 : 32} bg={colors.white} color={colors.dark} at={2 * FBEAT + i * 4}>
              ✓ {p}
            </Pill>
          ))}
        </div>
        <div style={{transform: `scale(${btn * pulse}) rotate(-2deg)`}}>
          <Pill size={vertical ? 68 : 58}>{funnyText.cta}</Pill>
        </div>
        <BigText size={vertical ? 64 : 54} at={4 * FBEAT}>
          {funny.site}
        </BigText>
        <BigText size={vertical ? 54 : 46} color={colors.red} at={4.5 * FBEAT}>
          📞 {funny.phone}
        </BigText>
        <BigText size={vertical ? 32 : 28} at={5 * FBEAT}>
          📍 {funny.zone}
        </BigText>
      </Col>
      <ConfettiBurst at={3 * FBEAT} count={50} spread={1.5} />
      <div style={{position: 'absolute', bottom: 4 * unit, left: 0, right: 0, textAlign: 'center', fontFamily: rounded, fontSize: 16 * unit, color: 'rgba(22,22,22,0.5)'}}>
        {funnyMusicCredit}
      </div>
    </>
  );
};
