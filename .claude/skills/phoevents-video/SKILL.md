---
name: phoevents-video
description: Créer, modifier ou régénérer les vidéos promo du photobooth Pho Events (Remotion) — textes, cadres d'exemple, voix off française, musique, bruitages et rendu MP4 pour Reels/TikTok/Instagram. À utiliser dès que l'utilisateur parle de vidéo, pub, reel, motion, voix off ou musique pour Pho Events / phoevents.fr.
---

# Vidéos promo Pho Events

Projet Remotion à la racine du dépôt. L'utilisatrice ne veut rien faire elle-même : on fait tout,
on vérifie, on rend les MP4, on les envoie, on commit et on pousse.

## Identité de marque (reprise de phoevents.fr)
- Couleurs : or `#D4AF37`, noir chaud `#17150F` / `#2C2A28`, crème `#FAF7F0`.
- Polices : Montserrat (texte) + Cormorant Garamond italique (titres) — embarquées dans `public/fonts/`.
- Logo rond : `public/logo.png`. Site : phoevents.fr · 07 68 67 27 55 · Savigny-le-Temple (77), Île-de-France.
- Formules : Digitale 180 € (numérique illimité), Signature 280 € (+200 tirages, « la plus choisie »),
  Premium 380 € (+400 tirages). Livraison/installation à partir de 30 € (ne jamais dire « offerte »).
- Avis Google 5,0/5. Ne rien inventer qui ne soit pas sur le site.

## Choix validés par l'utilisatrice
- **Pas d'IA mise en avant** pour l'instant, **pas de vraies personnes** à l'écran :
  on montre des **cadres d'exemple avec emplacements photo vides** (silhouettes génériques) pour que
  chacun s'imagine son événement.
- Les cadres doivent rester **assez longtemps** (≥ 4,5 s chacun) pour être bien vus.
- **Voix off qui accroche** (question d'accroche), **musique et bruitages bas** sous la voix.
- « Pho Events » est prononcé « Fo-Évent » par la voix (la prononciation anglaise est mal rendue).

## Où modifier quoi
| Quoi | Fichier |
|---|---|
| Textes à l'écran, cadres d'exemple, formules, avis | `src/config.ts` |
| Phrases de la voix off | `tools/make_voice.py` (`LINES`, `EXPECT`) |
| Ordre / durée des scènes, volume musique | `src/Promo.tsx` (`PLAN`, `musicVolume`) |
| Scènes | `src/components/Scenes.tsx` · cadres : `src/components/Template.tsx` |
| Bruitages | `tools/make_audio.py` → `public/audio/sfx-*.wav` (volume global `SFX_GAIN`) |

Les scènes s'allongent automatiquement selon `public/audio/voice/durations.json`.

## Outils (environnement cloud)
- Rendu : `npm run render:all -- --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  (sortie dans `videos/`). Vérifier avec `npx remotion still <Story|Post> out/x.png --frame=N` et regarder l'image.
- Voix : venv avec `torch==2.6.0` (index CPU) + `chatterbox-tts` + `faster-whisper`.
  Référence d'accent français : générer ~10 s avec Piper `fr_FR-siwis-medium`
  (huggingface.co/rhasspy/piper-voices), puis `python tools/make_voice.py ref.wav [clé…]`.
  Chaque prise est transcrite par Whisper ; on garde la meilleure. edge-tts ne marche pas ici (WebSocket bloqué).
- Musique : « Funky Chunk », Kevin MacLeod (incompetech.com), **CC BY 4.0** → crédit affiché en fin de vidéo
  et à mettre dans la description des publications. Pixabay/chosic sont bloqués (403).
- Effacer des personnes d'une photo (si un jour demandé) : `tools/remove_people.py` (rembg + LaMa).

## Contrôle qualité avant d'envoyer
1. Stills de chaque scène en 9:16 et 1:1 : rien de coupé, pas de retour à la ligne disgracieux.
2. Transcrire la piste son du MP4 final avec Whisper : toute la voix doit être compréhensible.
3. Je ne peux pas écouter : le dire honnêtement et demander l'avis de l'utilisatrice sur la voix et la musique.
