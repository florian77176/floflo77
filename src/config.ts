// ─────────────────────────────────────────────────────────────
//  TOUT CE QUI EST MODIFIABLE EST ICI.
//  Change les textes / couleurs puis relance le rendu.
// ─────────────────────────────────────────────────────────────

export const brand = {
  name: 'PhoEvents',
  tagline: 'Vos moments, sublimés',
  // Mets ton logo dans public/logo.png et passe ce champ à 'logo.png'
  logo: null as string | null,
  colors: {
    background: '#0B0B1A',
    backgroundAlt: '#1C1240',
    primary: '#F5C26B', // doré
    accent: '#FF4D8D', // rose néon
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.7)',
  },
};

export const event = {
  kicker: 'PhoEvents présente',
  title: 'La Soirée',
  titleHighlight: 'de l’Année',
  subtitle: 'DJ · Photobooth · Cocktails',
  date: 'Samedi 14 décembre',
  time: '20h00 – 04h00',
  place: 'Paris',
  cta: 'Réserve ta place',
  link: '@phoevents',
};
