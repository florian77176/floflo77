import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Polices embarquées dans public/fonts : rendu identique partout, même hors-ligne
export const sans = 'Montserrat';
export const serif = 'Playfair Display';

loadFont({family: sans, url: staticFile('fonts/Montserrat.woff2'), weight: '100 900'});
loadFont({family: serif, url: staticFile('fonts/PlayfairDisplay-Italic.woff2'), weight: '700', style: 'italic'});
