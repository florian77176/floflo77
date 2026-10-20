import type {Episode} from './series';

// Série Funny Loisirs. Faits repris de funnyloisirs.fr (prix « dès », hauteurs, âges, capacités) : ne rien inventer.
// Formats choisis d'après ce qui marche dans la location de structures gonflables (transformation / satisfying,
// question en commentaire, coulisses du service) et d'après les vidéos les plus vues du compte TikTok.

const WHO = {file: 'audio/who-likes-to-party.mp3', beat: 0.5108};
const CREDIT_WHO = 'Musique : « Who Likes to Party » Kevin MacLeod (incompetech.com) · CC BY 4.0';

export const EPISODES: Episode[] = [
  {
    // 1. Avant / après + gonflage en accéléré (format n°1 du secteur, et la vidéo de gonflage la plus vue du compte)
    id: 'avant-apres',
    music: {...WHO, start: 0.84},
    credit: CREDIT_WHO,
    shots: [
      {clip: 'hangar-empty', beats: 4, center: ['Ce terrain était', 'VIDE 😐']},
      {clip: 'hangar-full', beats: 4, center: ['Et maintenant…', 'REGARDE 🤯'], sfx: [{name: 'impact', vol: 0.8}]},
      {clip: 'safari-inflate', beats: 6, big: '1 MINUTE ⏱️', counter: [0, 60], name: 'Château Safari World 🐘', price: 'dès 280 €', sfx: [{name: 'inflate'}]},
      {clip: 'safari-reveal', beats: 4, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants'},
      {clip: 'animal-inflate', beats: 6, name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
      {clip: 'lego-inflate', beats: 5, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m de haut', sfx: [{name: 'inflate'}]},
      {clip: 'lego-drone-wide', beats: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m de haut'},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: 'Laquelle chez toi ? 👇', line: 'Location de structures gonflables en Seine-et-Marne'},
  },
  {
    // 2. Top 3 anniversaire : question « 1, 2 ou 3 » → commentaires ; vise les parents (ceux qui réservent)
    id: 'top3-anniversaire',
    music: {file: 'audio/pookatori-and-friends.mp3', start: 47.95, beat: 0.4876},
    credit: 'Musique : « Pookatori and Friends » Kevin MacLeod (incompetech.com) · CC BY 4.0',
    shots: [
      {clip: 'lego-drone-top', beats: 4, top: 'Anniversaire enfant 🎂', center: ['Tu choisis', 'LAQUELLE ?', '1, 2 ou 3 👇']},
      {clip: 'animal-inflate', beats: 6, num: 1, name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
      {clip: 'safari-inflate', beats: 6, num: 2, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants', sfx: [{name: 'inflate'}]},
      {clip: 'safari-reveal', beats: 4, num: 2, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants', sfx: [{name: 'riser', at: 0.35, vol: 0.6}]},
      {clip: 'lego-inflate', beats: 6, num: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m · dès 6 ans', sfx: [{name: 'impact', vol: 0.8}, {name: 'inflate', at: 0.1}]},
      {clip: 'lego-slide', beats: 5, num: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m · dès 6 ans', big: 'Même les parents y vont 😂'},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: '1, 2 ou 3 ? Commente 👇', line: 'Location de structures gonflables pour anniversaire · Seine-et-Marne'},
  },
  {
    // 3. Les adultes aussi : vise CE / team building / anniversaires adultes (plus gros paniers) ; « tag » = partages
    id: 'adultes',
    music: {file: 'audio/disco-con-tutti.mp3', start: 41.8, beat: 0.5108},
    credit: 'Musique : « Disco con Tutti » Kevin MacLeod (incompetech.com) · CC BY 4.0',
    shots: [
      {clip: 'sumo-clash', beats: 4, top: 'Les jeux gonflables…', center: ['Que pour', 'les enfants ? 😏']},
      {clip: 'cible-shoot', beats: 4, big: 'RATÉ 😈', name: 'Cible foot géante 🎯', sfx: [{name: 'impact', vol: 0.8}]},
      {clip: 'cible-hit', beats: 4, name: 'Cible foot géante 🎯', big: 'Dans le mille 🎯', sfx: [{name: 'impact', at: 0.85, vol: 0.6}]},
      {clip: 'p4-inflate', beats: 4, name: 'Puissance 4 basket 🏀', price: 'dès 180 €', sfx: [{name: 'inflate'}]},
      {clip: 'p4-group', beats: 4, name: 'Puissance 4 basket 🏀', price: 'dès 180 €'},
      {clip: 'sumo-roll', beats: 4, name: 'Sumos en mousse 🥋'},
      {clip: 'sumo-hit-slow', beats: 5, name: 'Sumos en mousse 🥋', sfx: [{name: 'impact', at: 0.6, vol: 0.7}]},
      {clip: 'sumo-fall', beats: 4, name: 'Sumos en mousse 🥋', big: 'Zéro dignité 😂'},
    ],
    end: {clip: 'sumo-clash', beats: 6, question: 'Tu défies qui ? Tag-le 👇', line: 'Team building · CE · anniversaires adultes · mariages'},
  },
  {
    // 4. Coulisses : la vidéo la plus vue du compte (vlog, 11 000 vues) ; rassure : on s'occupe de tout
    id: 'coulisses',
    music: {...WHO, start: 50.32},
    credit: CREDIT_WHO,
    shots: [
      {clip: 'vlog-garage', beats: 3, center: ['Ce qui se passe', 'AVANT ta fête 👀']},
      {clip: 'vlog-load', beats: 4, big: '① On charge 🚚'},
      {clip: 'vlog-road', beats: 3, big: '② On livre chez toi 📍'},
      {clip: 'vlog-unroll', beats: 4, big: '③ On installe'},
      {clip: 'vlog-inflate', beats: 4, big: '④ On gonfle 🎈', sfx: [{name: 'inflate'}]},
      {clip: 'vlog-stakes', beats: 3, big: '⑤ On sécurise ✅'},
      {clip: 'vlog-ready', beats: 5, center: ['Et toi ?', 'Tu profites 😎'], sfx: [{name: 'confetti'}]},
    ],
    end: {clip: 'safari-reveal', beats: 6, question: 'Ta fête, c’est quand ? 📅', line: 'Livraison et installation de structures gonflables · 77 & IDF'},
  },
];
