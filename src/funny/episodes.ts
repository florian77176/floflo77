import type {Episode} from './series';

// Série Funny Loisirs. Faits repris de funnyloisirs.fr (prix « dès », hauteurs, âges, capacités) : ne rien inventer.
// Formats choisis d'après ce qui marche dans la location de structures gonflables (transformation / satisfying,
// question en commentaire, coulisses du service) et d'après les vidéos les plus vues du compte TikTok.

// Musiques Mixkit (licence gratuite, usage commercial et réseaux sociaux autorisés, crédit non requis),
// choisies avec tools/listen.py (humeur, style, énergie) ; start calé pour que le « drop » tombe sur la révélation.
const HOUSE = {file: 'audio/mixkit-house-fest.mp3', beat: 0.4845}; // 124 BPM, drop à 15,79 s
const FUN = {file: 'audio/mixkit-fun-times.mp3', beat: 0.4138}; // 145 BPM, joyeux et joueur
const FUNK = {file: 'audio/mixkit-funkee-monkeee.mp3', beat: 0.5}; // 120 BPM, entrée du groupe à 6,78 s
const GROOVE = {file: 'audio/mixkit-midnight-funk.mp3', beat: 0.5098}; // 118 BPM, drop à 16,83 s

export const EPISODES: Episode[] = [
  {
    // 1. Avant / après + gonflage en accéléré (format n°1 du secteur, et la vidéo de gonflage la plus vue du compte)
    id: 'avant-apres',
    emojis: ['exploding-head', 'sparkles', 'star-struck'],
    music: {...HOUSE, start: 13.85}, // le drop (15,79 s) tombe sur « REGARDE »
    shots: [
      {clip: 'hangar-empty', beats: 4, center: ['Ce terrain était', 'VIDE 😐'], sfx: [{name: 'riser', at: 0.35, vol: 0.55}]},
      {clip: 'hangar-full', beats: 4, center: ['Et maintenant…', 'REGARDE 🤯'], sfx: [{name: 'impact', vol: 0.8}]},
      {clip: 'safari-ramp', beats: 6, fit: true, big: '1 MINUTE ⏱️', counter: [0, 60], name: 'Château Safari World 🐘', price: 'dès 280 €', sfx: [{name: 'inflate'}]},
      {clip: 'safari-reveal', beats: 4, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants'},
      {clip: 'animal-ramp', beats: 6, fit: true, name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
      {clip: 'lego-ramp', beats: 6, fit: true, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m de haut', sfx: [{name: 'inflate'}]},
      {clip: 'lego-drone-wide', beats: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m de haut'},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: 'Laquelle chez toi ? 👇', line: 'Location de structures gonflables en Seine-et-Marne'},
  },
  {
    // 2. Top 3 anniversaire : question « 1, 2 ou 3 » → commentaires ; vise les parents (ceux qui réservent)
    id: 'top3-anniversaire',
    emojis: ['cake', 'balloon', 'partying-face'],
    music: {...FUN, start: 13.37}, // le n°3 tombe sur la mesure la plus forte (23,31 s)
    shots: [
      {clip: 'lego-drone-top', beats: 5, top: 'Anniversaire enfant 🎂', center: ['Tu choisis', 'LAQUELLE ?', '1, 2 ou 3 👇']},
      {clip: 'animal-ramp', beats: 7, fit: true, num: 1, name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
      {clip: 'safari-ramp', beats: 7, fit: true, num: 2, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants', sfx: [{name: 'inflate'}]},
      {clip: 'safari-reveal', beats: 5, num: 2, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants', sfx: [{name: 'riser', at: 0.47, vol: 0.6}]},
      {clip: 'lego-ramp', beats: 7, fit: true, num: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m · dès 6 ans', sfx: [{name: 'impact', vol: 0.8}, {name: 'inflate', at: 0.1}]},
      {clip: 'lego-slide', beats: 6, num: 3, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m · dès 6 ans', big: 'Même les parents y vont 😂'},
    ],
    end: {clip: 'safari-inflate2', beats: 7, question: '1, 2 ou 3 ? Commente 👇', line: 'Location de structures gonflables pour anniversaire · Seine-et-Marne'},
  },
  {
    // 3. Les adultes aussi : vise CE / team building / anniversaires adultes (plus gros paniers) ; « tag » = partages
    id: 'adultes',
    emojis: ['joy', 'fire', 'sunglasses'],
    music: {...FUNK, start: 4.78}, // le groupe entre (6,78 s) pile sur « RATÉ »
    shots: [
      {clip: 'sumo-clash', beats: 4, top: 'Les jeux gonflables…', center: ['Que pour', 'les enfants ? 😏'], sfx: [{name: 'riser', at: 0.4, vol: 0.55}]},
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
    emojis: ['eyes', 'zap', 'sunglasses'],
    music: {...GROOVE, start: 16.83}, // démarre sur le drop : énergie dès la 1re image
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
  {
    // 5. Série « Tu m'as demandé » n°1 : FAQ météo (faits du site : report/annulation sans frais, contact avant
    // l'événement, installation possible en intérieur, prise électrique + surface plane)
    id: 'faq-pluie',
    emojis: ['eyes', 'check', 'point-down'],
    music: {...GROOVE, start: 33.09},
    shots: [
      {clip: 'lego-drone-wide', beats: 5, top: 'On nous le demande souvent 💬', center: ['Et s’il', 'PLEUT ? 🌧️']},
      {clip: 'vlog-road', beats: 4, big: 'On suit la météo avec toi 📲'},
      {clip: 'safari-reveal', beats: 5, big: 'Vent fort ou grosse pluie ?', name: 'Report ou annulation', price: 'SANS FRAIS ✅', sfx: [{name: 'impact', vol: 0.6}]},
      {clip: 'lego-ramp', beats: 6, fit: true, big: 'Et en hiver ? On installe en intérieur 🏠', sfx: [{name: 'inflate'}]},
      {clip: 'animal-ramp', beats: 5, fit: true, big: 'Salle, gymnase, préau 👌', sfx: [{name: 'inflate'}]},
      {clip: 'vlog-stakes', beats: 4, big: 'Il faut juste une prise ⚡ et une surface plane'},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: 'Une autre question ? 👇', line: 'Location de structures gonflables · Seine-et-Marne & IDF'},
  },
  {
    // 6. Saison : fêtes d'entreprise de fin d'année (cible CE / team building, cité sur le site)
    id: 'fetes-entreprise',
    emojis: ['party-popper', 'trophy', 'clinking-glasses'],
    music: {...HOUSE, start: 44.82}, // drop (46,76 s) sur le 1er jeu
    shots: [
      {clip: 'p4-group', beats: 4, top: 'Entreprises & CE 🎄', center: ['Ta fête de', 'FIN D’ANNÉE', 'cette année ?'], sfx: [{name: 'riser', at: 0.35, vol: 0.55}]},
      {clip: 'sumo-clash', beats: 4, big: 'Sumos en mousse 🥋', sfx: [{name: 'impact', vol: 0.8}]},
      {clip: 'cible-hit', beats: 4, big: 'Cible foot géante 🎯', sfx: [{name: 'impact', at: 0.85, vol: 0.6}]},
      {clip: 'p4-play', beats: 4, big: 'Puissance 4 basket 🏀', price: 'dès 180 €'},
      {clip: 'lego-ramp', beats: 6, fit: true, big: 'Et pour les enfants 🎈', name: 'LEGO géante 🧱', price: 'dès 450 €', sfx: [{name: 'inflate'}]},
      {clip: 'animal-ramp', beats: 5, fit: true, big: 'En salle ou dehors 🏠', name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
    ],
    end: {clip: 'hangar-full', beats: 6, question: 'Devis en 24h 📩', line: 'Team building · fêtes d’entreprise · CE · 77 & Île-de-France'},
  },
  {
    // 7. Série « Combien ça coûte ? » : prix « dès » du site, hors livraison (dit clairement)
    id: 'combien-ca-coute',
    emojis: ['money-wings', 'eyes', 'point-down'],
    music: {...FUN, start: 14.21}, // la LEGO tombe sur la mesure la plus forte (23,31 s)
    shots: [
      {clip: 'lego-drone-top', beats: 5, top: 'Une structure gonflable…', center: ['Ça coûte', 'COMBIEN ? 💸']},
      {clip: 'p4-play', beats: 5, name: 'Puissance 4 basket 🏀', price: 'dès 180 €'},
      {clip: 'animal-ramp', beats: 6, fit: true, name: 'Animal Land 🦁', price: 'dès 250 €', sfx: [{name: 'inflate'}]},
      {clip: 'safari-ramp', beats: 6, fit: true, name: 'Château Safari World 🐘', price: 'dès 280 €', info: 'dès 3 ans · ~9 enfants', sfx: [{name: 'inflate'}, {name: 'riser', at: 0.88, vol: 0.55}]},
      {clip: 'lego-ramp', beats: 6, fit: true, name: 'LEGO géante 🧱', price: 'dès 450 €', info: '5,3 m · dès 6 ans', sfx: [{name: 'impact', vol: 0.8}, {name: 'inflate', at: 0.1}]},
      {clip: 'vlog-ready', beats: 5, big: 'Matériel nettoyé et contrôlé ✅'},
    ],
    end: {clip: 'safari-inflate2', beats: 7, question: 'Laquelle pour ta fête ? 👇', line: 'Prix « à partir de », hors livraison · devis gratuit en 24h'},
  },
  {
    // 8. POV humour : le parent « juste 5 minutes » (adultes de l'équipe dans les rushs)
    id: 'pov-parents',
    music: {...FUNK, start: 22.8}, // la mesure la plus forte (24,80 s) tombe sur « 2 heures plus tard »
    emojis: ['eyes', 'joy', 'point-down'],
    shots: [
      {clip: 'lego-climb', beats: 4, top: 'POV : t’as dit', center: ['« juste', '5 minutes »', '😅']},
      {clip: 'lego-slide', beats: 5, big: '2 heures plus tard…', sfx: [{name: 'boing', at: 0.3, vol: 0.6}], floaters: [{emoji: 'joy', x: 0.86, y: 0.1, size: 150, at: 0.6}]},
      {clip: 'p4-play', beats: 4, big: 'Il est toujours là 😂', floaters: [{emoji: 'basketball', x: 0.85, y: 0.62, size: 130, at: 0.4}]},
      {clip: 'sumo-roll', beats: 4, big: 'Puis il découvre les sumos 🥋'},
      {clip: 'sumo-fall', beats: 4, big: 'Zéro regret 😎', sfx: [{name: 'impact', at: 0.5, vol: 0.6}], floaters: [{emoji: 'sunglasses', x: 0.86, y: 0.1, size: 150, at: 0.3}]},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: 'Tag le parent comme ça 👇', line: 'Location de structures gonflables · 77 & Île-de-France'},
  },
  {
    // 9. Série « 60 secondes chrono » : Animal Land en 19 secondes (chiffre de leur légende TikTok)
    id: 'animal-land-19s',
    music: {...HOUSE, start: 13.85}, // drop (15,79 s) au début du gonflage
    emojis: ['eyes', 'zap', 'star-struck'],
    shots: [
      {clip: 'animal-ramp', beats: 4, top: 'Animal Land 🦁', center: ['19 SECONDES', 'chrono ⏱️'], sfx: [{name: 'riser', at: 0.35, vol: 0.55}]},
      {clip: 'animal-inflate', beats: 9, fit: true, big: 'Regarde bien 👀', counter: [0, 19], sfx: [{name: 'impact', vol: 0.6}, {name: 'inflate', at: 0.1}]},
      {clip: 'animal-final', beats: 6, big: 'Et voilà 🤯', name: 'Animal Land 🦁', price: 'dès 250 €', confetti: 0.1, sweep: 0.1, floaters: [{emoji: 'exploding-head', x: 0.86, y: 0.1, size: 160, at: 0.2}]},
    ],
    end: {clip: 'hangar-full', beats: 6, question: 'Tu la veux à ta fête ? 👇', line: 'Location de structures gonflables · Seine-et-Marne & IDF'},
  },
  {
    // 10. Série « Tu m'as demandé » n°2 : combien de place ? (dimensions du site)
    id: 'faq-place',
    music: {...GROOVE, start: 41.22},
    emojis: ['eyes', 'check', 'point-down'],
    shots: [
      {clip: 'lego-drone-top', beats: 5, top: 'On nous le demande souvent 💬', center: ['Il faut combien', 'DE PLACE ? 📏']},
      {clip: 'lego-drone-wide', beats: 5, name: 'LEGO géante 🧱', price: '9,5 × 4 m', info: '5,3 m de haut'},
      {clip: 'safari-reveal', beats: 5, name: 'Château Safari World 🐘', price: '5,4 × 5 m', info: '3,9 m de haut'},
      {clip: 'p4-play', beats: 4, name: 'Puissance 4 basket 🏀', price: '3,1 × 3,7 m', info: '3,7 m de haut'},
      {clip: 'vlog-stakes', beats: 5, big: 'Une surface plane + une prise ⚡ = c’est bon 👌', floaters: [{emoji: 'check', x: 0.86, y: 0.62, size: 140, at: 0.5}]},
    ],
    end: {clip: 'safari-inflate2', beats: 6, question: 'Envoie-nous ton espace 📸', line: 'On te conseille la bonne structure · devis en 24h'},
  },
  {
    // 11. LEGO géante : visite de la structure de 5,3 m
    id: 'lego-geante',
    music: {...FUN, start: 13.37},
    emojis: ['exploding-head', 'sparkles', 'star-struck'],
    shots: [
      {clip: 'lego-drone-top', beats: 5, top: 'LEGO géante 🧱', center: ['5,3 MÈTRES', 'de haut 🤯']},
      {clip: 'lego-ramp', beats: 7, fit: true, big: 'Elle se gonfle…', sfx: [{name: 'inflate'}]},
      {clip: 'lego-front', beats: 3, big: '…et elle te regarde 👀', sfx: [{name: 'impact', vol: 0.6}]},
      {clip: 'lego-drone-side', beats: 4, name: 'Toboggan + escalade 🛝', floaters: [{emoji: 'zap', x: 0.86, y: 0.12, size: 140, at: 0.3}]},
      {clip: 'lego-climb', beats: 5, big: 'On grimpe…'},
      {clip: 'lego-slide', beats: 5, big: '…et on glisse 😂', sfx: [{name: 'boing', at: 0.2, vol: 0.6}]},
    ],
    end: {clip: 'safari-inflate2', beats: 7, question: 'Dispo pour ta fête 👇', line: 'LEGO géante · dès 450 € · dès 6 ans · 77 & IDF'},
  },
];
