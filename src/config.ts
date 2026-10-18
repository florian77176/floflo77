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
  hook: ['Le souvenir que', 'vos invités vont', 's’arracher'],
  smile: 'Souriez !',
  templatesTitle: 'Votre cadre, votre style',
  // Exemples de cadres personnalisés (les emplacements photo restent vides pour que chacun s'imagine)
  templates: [
    {event: 'Mariage', style: 'mariage', layout: 'strip', title: 'Julie & Thomas', subtitle: '14 · 06 · 2027'},
    {event: 'Anniversaire', style: 'anniversaire', layout: 'grid', title: 'Les 30 ans de Léa', subtitle: 'Samedi 10 avril 2027'},
    {event: 'Baptême', style: 'bapteme', layout: 'single', title: 'Baptême de Gabriel', subtitle: '8 mai 2027'},
    {event: 'Baby shower', style: 'babyshower', layout: 'duo', title: 'Bienvenue petite Rose', subtitle: 'Baby shower · 3 juillet 2027'},
    {event: 'Entreprise', style: 'entreprise', layout: 'logo', title: 'Soirée annuelle', subtitle: 'Votre entreprise · 2027'},
  ],
  prints: {title: 'Imprimées sur place', subtitle: 'Vos invités repartent avec leurs souvenirs le soir même'},
  included: {
    title: 'Tout ce qu’il vous faut',
    items: [
      {icon: '📸', text: 'Photos numériques illimitées'},
      {icon: '🖨️', text: 'Tirages imprimés sur place'},
      {icon: '🎨', text: 'Cadre personnalisé à votre image'},
      {icon: '📩', text: 'Vos photos envoyées sous 48h'},
      {icon: '🚚', text: 'Livraison & installation'},
      {icon: '✅', text: 'Matériel vérifié à chaque fois'},
    ],
  },
  formulas: {
    title: 'Nos formules',
    items: [
      {name: 'Digitale', price: '180 €', detail: 'Photos numériques illimitées', badge: ''},
      {name: 'Signature', price: '280 €', detail: '+ 200 tirages imprimés', badge: 'La plus choisie'},
      {name: 'Premium', price: '380 €', detail: '+ 400 tirages imprimés', badge: ''},
    ],
  },
  review: {
    score: '5,0 / 5',
    source: 'avis Google',
    quote: 'Le photobooth fut une très agréable surprise pour notre journée d’anniversaire',
    author: 'Daniel T.',
  },
  cta: 'Réservez votre date',
  ctaSub: 'Devis gratuit · réponse sous 24h',
};
