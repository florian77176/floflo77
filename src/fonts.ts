import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Polices du site phoevents.fr, embarquées dans public/fonts (rendu identique partout)
export const sans = 'Montserrat';
export const serif = 'Cormorant Garamond';
// police du site funnyloisirs.fr (nom entre guillemets : il contient un chiffre)
export const roundedFamily = 'Baloo 2';
export const rounded = `'${roundedFamily}', sans-serif`;

loadFont({family: sans, url: staticFile('fonts/Montserrat.woff2'), weight: '100 900'});
loadFont({family: serif, url: staticFile('fonts/Cormorant.woff2'), weight: '600'});
loadFont({family: serif, url: staticFile('fonts/Cormorant-Italic.woff2'), weight: '500 600', style: 'italic'});
loadFont({family: roundedFamily, url: staticFile('fonts/Baloo2.woff2'), weight: '400 800'});
