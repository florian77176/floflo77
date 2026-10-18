// ─────────────────────────────────────────────────────────────
//  TOUT CE QUI EST MODIFIABLE EST ICI (infos reprises de phoevents.fr).
//  Change un texte puis relance `npm run render:all`.
// ─────────────────────────────────────────────────────────────

export const brand = {
  name: 'Pho Events',
  logo: 'logo.png',
  site: 'phoevents.fr',
  phone: '07 68 67 27 55',
  zone: 'Seine-et-Marne & Île-de-France',
  colors: {
    background: '#17150F',
    backgroundAlt: '#2C2A28',
    gold: '#D4AF37',
    goldLight: '#F1D78A',
    goldDark: '#B8952C',
    cream: '#FAF7F0',
    muted: 'rgba(250,247,240,0.72)',
  },
};

// Reel « Tu choisis lequel ? » : court, rythmé, calé sur la musique, pensé pour Instagram / TikTok
export const reel = {
  kicker: 'Cadres photobooth',
  hook: ['Tu choisis', 'lequel ?'],
  hookSub: '1, 2, 3 ou 4 ? 👇',
  // Les cadres d'exemple (emplacements photo vides pour que chacun s'imagine)
  templates: [
    {event: 'Mariage', style: 'mariage', layout: 'strip', title: 'Julie & Thomas', subtitle: '14 · 06 · 2027'},
    {event: 'Anniversaire', style: 'anniversaire', layout: 'grid', title: 'Les 30 ans de Léa', subtitle: 'Samedi 10 avril 2027'},
    {event: 'Baby shower', style: 'babyshower', layout: 'duo', title: 'Bienvenue petite Rose', subtitle: 'Baby shower · 3 juillet 2027'},
    {event: 'Entreprise', style: 'entreprise', layout: 'logo', title: 'Soirée annuelle', subtitle: 'Votre entreprise · 2027'},
  ],
  recap: 'Commente ton numéro 👇',
  prints: 'Imprimé sur place ✨',
  price: 'Dès 180 €',
  stars: '5,0 / 5 sur Google',
  cta: 'Réserve ta date',
  ctaSub: 'Devis gratuit · réponse sous 24h',
};

// Musique : « Funky Chunk » (117 BPM). On démarre sur sa partie la plus énergique et on coupe sur les temps.
export const music = {
  file: 'audio/funky-chunk.mp3',
  startSec: 33.46, // début d'une phrase musicale (temps fort)
  beatSec: 0.5108, // durée d'un temps
};

// Crédit obligatoire de la musique (licence CC BY 4.0)
export const musicCredit = 'Musique : « Funky Chunk » Kevin MacLeod (incompetech.com) · CC BY 4.0';
