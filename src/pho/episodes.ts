import type {PhoEpisode} from './cards';

// Pho Events : vidéos avec de vrais modèles de cadres (Canva). Faits repris de phoevents.fr.
// Musiques : Funky Chunk (Kevin MacLeod, CC BY 4.0 → crédit) et Mixkit (crédit non requis), choisies avec tools/listen.py.

const CREDIT_FUNKY = 'Musique : « Funky Chunk » Kevin MacLeod (incompetech.com) · CC BY 4.0';

export const PHO_EPISODES: PhoEpisode[] = [
  {
    // 1. « Tu choisis lequel ? » : 4 vrais modèles numérotés → commentaires
    id: 'choisis-ton-cadre',
    music: {file: 'audio/funky-chunk.mp3', start: 33.46, beat: 0.5108},
    credit: CREDIT_FUNKY,
    scenes: [
      {kind: 'hook', beats: 4, kicker: 'Photobooth', lines: ['Ton cadre,', 'tu choisis', 'lequel ? 👇'], floaters: [{emoji: 'camera-flash', x: 0.15, y: 0.18, size: 170, depth: 0.8, at: -1}, {emoji: 'sparkles', x: 0.86, y: 0.82, size: 150, at: -1}]},
      {kind: 'card', beats: 5, tpl: 'mariage-bande', entry: 'drop', num: 1, label: 'Mariage romantique 💍', floaters: [{emoji: 'heart-eyes', x: 0.88, y: 0.14, size: 130, at: 0.6}]},
      {kind: 'card', beats: 5, tpl: 'mariage-boheme', entry: 'flip', num: 2, label: 'Mariage bohème 🌿', floaters: [{emoji: 'smiling-hearts', x: 0.88, y: 0.8, size: 130, at: 0.6}]},
      {kind: 'card', beats: 5, tpl: 'anniversaire-30', entry: 'slide', num: 3, label: 'Anniversaire 🎉', floaters: [{emoji: 'partying-face', x: 0.88, y: 0.14, size: 130, at: 0.6}]},
      {kind: 'card', beats: 5, tpl: 'entreprise', entry: 'zoom', num: 4, label: 'Soirée d’entreprise ✨', floaters: [{emoji: 'clinking-glasses', x: 0.88, y: 0.82, size: 130, at: 0.6}]},
      {kind: 'grid', beats: 5, tpls: ['mariage-bande', 'mariage-boheme', 'anniversaire-30', 'entreprise'], numbered: true, text: 'Commente ton numéro 👇', sfx: [{name: 'sparkle', at: 0.75}]},
      {kind: 'cta', beats: 6, question: 'Réserve ta date 📅', sfx: [{name: 'ding', at: 0.2}]},
    ],
  },
  {
    // 2. « Mariage 2027 » v2 : le tirage arrive, la caméra plonge dans chaque photo
    id: 'mariage-2027',
    music: {file: 'audio/mixkit-tears-of-joy.mp3', start: 8.52, beat: 0.4839},
    scenes: [
      {kind: 'hook', beats: 4, kicker: 'Mariage 2027 💍', lines: ['Vos invités', 'repartent', 'avec ÇA 👇'], floaters: [{emoji: 'ring', x: 0.14, y: 0.16, size: 160, depth: 0.8, at: -1}, {emoji: 'sparkles', x: 0.86, y: 0.84, size: 140, at: -1}]},
      {
        kind: 'card', beats: 13, tpl: 'mariage-bande', entry: 'drop', label: 'Imprimé sur place ✨',
        tour: {from: 3, every: 3, slots: [0, 1, 2], captions: ['Les témoins 😂', 'Team bride 👰', 'Les mariés 💍']},
        floaters: [{emoji: 'camera-flash', x: 0.88, y: 0.12, size: 130, at: 0.5}],
      },
      {kind: 'card', beats: 5, tpl: 'mariage-boheme', entry: 'flip', label: 'Ou version bohème 🌿', caption: 'À vos prénoms, vos couleurs', floaters: [{emoji: 'smiling-hearts', x: 0.86, y: 0.16, size: 130, at: 0.6}]},
      {kind: 'formula', beats: 5, sfx: [{name: 'sparkle', at: 0.1}]},
      {kind: 'cta', beats: 7, question: 'Réservez votre date 💍', sfx: [{name: 'ding', at: 0.2}]},
    ],
  },
  {
    // 3. « Anniversaire » : le modèle 30 ans et la visite de ses 4 photos, puis les 50 ans
    id: 'anniversaire',
    music: {file: 'audio/mixkit-disco-aint-old-school.mp3', start: 21.65, beat: 0.4801}, // le groupe entre (23,57 s) sur le tirage
    scenes: [
      {kind: 'hook', beats: 4, kicker: 'Anniversaire 🎂', lines: ['Ton anniversaire,', 'version', 'SOUVENIRS 📸'], floaters: [{emoji: 'partying-face', x: 0.14, y: 0.15, size: 160, depth: 0.8, at: -1}, {emoji: 'balloon', x: 0.87, y: 0.83, size: 150, at: -1}]},
      {
        kind: 'card', beats: 15, tpl: 'anniversaire-30', entry: 'drop', label: 'Les 30 ans de Léa 🎉', sfx: [{name: 'impact', vol: 0.6}],
        tour: {from: 3, every: 3, slots: [0, 1, 2, 3], captions: ['Birthday queen 👑', 'Les copines 😍', 'Légendes 😎', 'Fais un vœu ✨']},
        floaters: [{emoji: 'party-popper', x: 0.88, y: 0.12, size: 130, at: 0.5}],
      },
      {kind: 'card', beats: 6, tpl: 'anniversaire-50', entry: 'slide', label: '30, 40, 50 ans… 🥳', caption: 'Chacun repart avec sa photo', floaters: [{emoji: 'star-struck', x: 0.86, y: 0.82, size: 130, at: 0.6}]},
      {kind: 'formula', beats: 5, sfx: [{name: 'sparkle', at: 0.1}]},
      {kind: 'cta', beats: 6, question: 'Tu fêtes quoi en 2027 ? 👇', sfx: [{name: 'ding', at: 0.2}]},
    ],
  },
  {
    // 4. « Un cadre pour chaque moment » : coupes rapides sur le rythme
    id: 'chaque-moment',
    music: {file: 'audio/mixkit-one-more-dance.mp3', start: 12.04, beat: 0.5437}, // drop (14,21 s) sur le 1er modèle
    scenes: [
      {kind: 'hook', beats: 4, kicker: 'Pho Events', lines: ['Un cadre', 'pour chaque', 'moment ✨'], floaters: [{emoji: 'camera-flash', x: 0.15, y: 0.16, size: 160, depth: 0.8, at: -1}, {emoji: 'red-heart', x: 0.86, y: 0.84, size: 140, at: -1}]},
      {kind: 'card', beats: 3, tpl: 'bapteme', entry: 'zoom', label: 'Baptême 🕊️', sfx: [{name: 'impact', vol: 0.5}]},
      {kind: 'card', beats: 3, tpl: 'baby-shower', entry: 'flip', label: 'Baby shower 🍼'},
      {kind: 'card', beats: 3, tpl: 'anniversaire-50', entry: 'slide', label: 'Anniversaire 🥳'},
      {kind: 'card', beats: 3, tpl: 'entreprise', entry: 'drop', label: 'Entreprise ✨'},
      {kind: 'card', beats: 3, tpl: 'mariage-boheme', entry: 'flip', label: 'Mariage 💍'},
      {kind: 'grid', beats: 5, tpls: ['bapteme', 'baby-shower', 'anniversaire-30', 'entreprise', 'mariage-bande', 'anniversaire-50'], text: 'À vos prénoms, vos couleurs 🎨'},
      {kind: 'cta', beats: 6, question: 'Et le vôtre ? 👇', sfx: [{name: 'ding', at: 0.2}]},
    ],
  },
];
