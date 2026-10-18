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

export const promo = {
  hook: ['Et si vos invités', 'devenaient', 'des stars ?'],
  themesTitle: 'Fonds animés par IA',
  themes: [
    {photo: 'photos/boxe.jpg', label: 'Champions de boxe', emoji: '🥊'},
    {photo: 'photos/film-noir.jpg', label: 'Héros de film noir', emoji: '🎬'},
    {photo: 'photos/safari.jpg', label: 'Aventuriers en safari', emoji: '🦒'},
  ],
  prints: {photo: 'photos/tirages.jpg', title: 'Imprimées sur place', subtitle: 'Vos invités repartent avec leurs souvenirs le soir même'},
  custom: {photo: 'photos/famille.jpg', title: 'Un cadre à votre image', subtitle: 'Vos prénoms · votre date · vos couleurs'},
  review: {
    score: '5,0 / 5',
    source: 'avis Google',
    quote: 'Le photobooth fut une très agréable surprise pour notre journée d’anniversaire',
    author: 'Daniel T.',
  },
  events: ['Mariage', 'Anniversaire', 'Baptême', 'Baby shower', 'Soirée privée', 'Entreprise'],
  price: 'À partir de 180 €',
  cta: 'Réservez votre date',
  ctaSub: 'Devis gratuit · réponse sous 24h',
};
