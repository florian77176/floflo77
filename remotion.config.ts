import {Config} from '@remotion/cli/config';

// Qualité d'export pour Instagram / TikTok : images PNG sans perte, H.264 très peu compressé,
// couleurs standard vidéo (BT.709, plage TV) pour que les réseaux ne dégradent pas l'image en la convertissant
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(14);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');
