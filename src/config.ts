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
  hook: ['Et si vos invités', 'changeaient', 'de monde ?'],
  themesTitle: 'Fonds animés par IA',
  themes: [
    {decor: 'decors/boxe.jpg', label: 'Le ring de boxe', emoji: '🥊'},
    {decor: 'decors/safari.jpg', label: 'Le safari', emoji: '🦒'},
    {decor: 'decors/film-noir.jpg', label: 'Le film noir', emoji: '🎬'},
  ],
  templatesTitle: 'Un cadre à votre image',
  // Exemples de cadres personnalisés montrés dans la vidéo
  templates: [
    {event: 'Mariage', style: 'mariage', title: 'Julie & Thomas', subtitle: '14 juin 2027', decor: 'decors/film-noir-2.jpg'},
    {event: 'Anniversaire', style: 'anniversaire', title: 'Les 30 ans de Léa', subtitle: 'Samedi 10 avril 2027', decor: 'decors/boxe.jpg'},
    {event: 'Baptême', style: 'bapteme', title: 'Baptême de Gabriel', subtitle: '8 mai 2027', decor: 'decors/safari.jpg'},
    {event: 'Entreprise', style: 'entreprise', title: 'Soirée annuelle', subtitle: 'Votre logo · vos couleurs', decor: 'decors/film-noir.jpg'},
  ],
  prints: {title: 'Imprimées sur place', subtitle: 'Vos invités repartent avec leurs souvenirs le soir même'},
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
