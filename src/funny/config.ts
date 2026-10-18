// ─────────────────────────────────────────────────────────────
//  FUNNY LOISIRS — tout ce qui est modifiable (infos reprises de funnyloisirs.fr)
// ─────────────────────────────────────────────────────────────

export const funny = {
  name: 'Funny Loisirs',
  logo: 'funny/logo.png',
  site: 'funnyloisirs.fr',
  phone: '07 83 80 57 14',
  zone: 'Seine-et-Marne (77) & Île-de-France',
  colors: {
    yellow: '#FCDB5D',
    yellowLight: '#FDE896',
    orange: '#FDAF00',
    red: '#FE3030',
    dark: '#161616',
    cream: '#FAF5EC',
    white: '#FFFFFF',
    blue: '#2F7BFF',
    green: '#2DBE60',
  },
};

// Les 4 structures montrées (photos du site détourées). ratio = largeur / hauteur de l'image.
export const structures = [
  {name: 'LEGO géante', image: 'funny/structures/lego.png', ratio: 1300 / 1253, price: 'dès 450 €', badge: 'Nouveau'},
  {name: 'Château Safari', image: 'funny/structures/safari.png', ratio: 1300 / 1217, price: 'dès 280 €', badge: 'Best-seller'},
  {name: 'Puissance 4 basket', image: 'funny/structures/p4.png', ratio: 960 / 896, price: 'dès 180 €', badge: ''},
  {name: 'Curling gonflable', image: 'funny/structures/curling.png', ratio: 954 / 647, price: 'dès 200 €', badge: 'Nouveau'},
];

export const funnyText = {
  hook: ['Laquelle', 'tu choisis', 'pour ta fête ? 🎈'],
  hookSub: '1, 2, 3 ou 4 ?',
  allFour: 'Ou… les 4 ? 😏',
  comment: 'Commente ton numéro 👇',
  storyComment: 'Vote dans le sondage 👇',
  occasionsTitle: 'Pour toutes tes fêtes 🎉',
  occasions: ['🎂 Anniversaire', '🏫 Kermesse', '💍 Mariage', '🏢 Team building', '🏘️ Fête de quartier'],
  more: '+ bubble foot, sumo, lancer de hache…',
  reviews: '5/5 · 25 avis Google',
  perks: ['Devis gratuit en 24h', 'Livraison & installation'],
  cta: 'Réserve ta date !',
};

// Musique : « Who Likes to Party » (117 BPM), démarrée sur son premier temps fort
export const funnyMusic = {
  file: 'audio/who-likes-to-party.mp3',
  startSec: 0.84,
  beatSec: 0.5108,
};
export const funnyMusicCredit = 'Musique : « Who Likes to Party » Kevin MacLeod (incompetech.com) · CC BY 4.0';
