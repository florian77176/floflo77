import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Polices du site phoevents.fr, embarquées dans public/fonts (rendu identique partout)
export const sans = 'Montserrat';
export const serif = 'Cormorant Garamond';

loadFont({family: sans, url: staticFile('fonts/Montserrat.woff2'), weight: '100 900'});
loadFont({family: serif, url: staticFile('fonts/Cormorant.woff2'), weight: '600'});
loadFont({family: serif, url: staticFile('fonts/Cormorant-Italic.woff2'), weight: '500 600', style: 'italic'});
