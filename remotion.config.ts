import {Config} from '@remotion/cli/config';

// Qualité d'export : H.264, CRF bas = image très nette (idéal Instagram / TikTok)
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');
