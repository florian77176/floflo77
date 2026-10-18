---
name: phoevents-video
description: Créer, modifier ou régénérer les vidéos promo du photobooth Pho Events (Remotion) — textes, cadres d'exemple, voix off française, musique, bruitages et rendu MP4 pour Reels/TikTok/Instagram. À utiliser dès que l'utilisateur parle de vidéo, pub, reel, motion, voix off ou musique pour Pho Events / phoevents.fr.
---

# Vidéos promo Pho Events

Projet Remotion à la racine du dépôt. Le ou la propriétaire de Pho Events ne veut rien faire soi-même : on fait tout,
on vérifie, on rend les MP4, on les envoie, on commit et on pousse.

## Identité de marque (reprise de phoevents.fr)
- Couleurs : or `#D4AF37`, noir chaud `#17150F` / `#2C2A28`, crème `#FAF7F0`.
- Polices : Montserrat (texte) + Cormorant Garamond italique (titres) — embarquées dans `public/fonts/`.
- Logo rond : `public/logo.png`. Site : phoevents.fr · 07 68 67 27 55 · Savigny-le-Temple (77), Île-de-France.
- Formules : Digitale 180 € (numérique illimité), Signature 280 € (+200 tirages, « la plus choisie »),
  Premium 380 € (+400 tirages). Livraison/installation à partir de 30 € (ne jamais dire « offerte »).
- Avis Google 5,0/5. Ne rien inventer qui ne soit pas sur le site.

## Choix validés par le client
- **Pas d'IA mise en avant** pour l'instant, **pas de vraies personnes** à l'écran :
  on montre des **cadres d'exemple avec emplacements photo vides** (silhouettes génériques) pour que
  chacun s'imagine son événement.
- Vidéo **courte** (~24 s), pensée pour percer sur Instagram / TikTok : concept « Tu choisis lequel ? »,
  cadres numérotés, « Commente ton numéro 👇 », coupes sur le rythme (117 BPM), tutoiement.
- **Pas de compte à rebours 3-2-1** (pas apprécié).
- Version principale **sans voix** (la voix IA féminine n'a pas plu). Variante avec **voix d'homme**
  (référence Piper `fr_FR-tom-medium`). Éviter « photos » au pluriel dans la voix (la voix dit « photosse »).
- « Pho Events » se prononce **« Pho Eveunte »** : l'écrire « Fo Éveunte » dans le texte de la voix.

## Où modifier quoi
| Quoi | Fichier |
|---|---|
| Textes à l'écran, cadres d'exemple, prix, musique (début, tempo) | `src/config.ts` (`reel`, `music`) |
| Phrases de la voix off | `tools/make_voice.py` (`LINES`, `EXPECT`) |
| Ordre / durée des scènes (en temps musicaux), volume musique | `src/Reel.tsx` (`STEPS`, `musicVolume`) |
| Scènes | `src/components/Scenes.tsx` · cadres : `src/components/Template.tsx` |
| Bruitages | `tools/make_audio.py` → `public/audio/sfx-*.wav` (volume global `SFX_GAIN`) |

Avec la voix, les scènes s'allongent (par temps entiers) selon `public/audio/voice/durations.json`.
Compositions par réseau (`src/Root.tsx`) : `Instagram-Reel`, `Instagram-Reel-SansMusique`, `Instagram-Story`,
`Feed-4x5`, `TikTok`, `TikTok-SansMusique`, `Snapchat-Spotlight`, `Snapchat-Story`, `Reel-VoixHomme`, `Cover`, `Intro`.
Zones visibles par réseau : `SAFE_ZONES` dans `src/components/ui.tsx`. Montage `story` (~17 s, < 20 s pour Facebook)
avec place pour un sticker sondage. Facebook réutilise les fichiers Instagram.

## Outils (environnement cloud)
- Rendu : `sh tools/render_phoevents.sh /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  (sortie dans `videos/phoevents/<réseau>/`). Vérifier avec `npx remotion still <Story|Post> out/x.png --frame=N` et regarder l'image.
- Voix : venv avec `torch==2.6.0` (index CPU) + `chatterbox-tts` + `faster-whisper`.
  Référence d'accent français : générer ~10 s avec Piper `fr_FR-siwis-medium`
  (huggingface.co/rhasspy/piper-voices), puis `python tools/make_voice.py ref.wav [clé…]`.
  Chaque prise est transcrite par Whisper ; on garde la meilleure. edge-tts ne marche pas ici (WebSocket bloqué).
- Musique : « Funky Chunk », Kevin MacLeod (incompetech.com), **CC BY 4.0** → crédit affiché en fin de vidéo
  et à mettre dans la description des publications. Pixabay/chosic sont bloqués (403).
- Effacer des personnes d'une photo (si un jour demandé) : `tools/remove_people.py` (rembg + LaMa).

## Contrôle qualité avant d'envoyer
0. La **toute première image** doit déjà montrer l'accroche (pas de fondu depuis le noir) : c'est l'aperçu dans le fil.
   Le texte d'appel aux commentaires doit rester ≥ 3 s à l'écran. Couverture : composition `Cover`.
1. Stills de chaque scène en 9:16 et 1:1 : rien de coupé, pas de retour à la ligne disgracieux.
2. Transcrire la piste son du MP4 final avec Whisper : toute la voix doit être compréhensible.
3. Je ne peux pas écouter : le dire honnêtement et demander l'avis du client sur la voix et la musique.
