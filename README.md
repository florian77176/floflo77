# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-story.mp4` | 1080×1920 · 68 s | Reel / Story Instagram, TikTok |
| `phoevents-post.mp4` | 1080×1080 · 68 s | Post Instagram / Facebook |
| `phoevents-intro.mp4` | 1920×1080 · 4 s | Intro logo YouTube, écran d'événement |

Déroulé : accroche « Vous préparez un mariage, un anniversaire ou une soirée ? » → compte à rebours « Souriez ! » →
5 cadres d'exemple avec emplacements photo, ~6 s chacun avec une phrase dédiée (mariage, anniversaire, baptême,
baby shower, entreprise) → tirage qui sort de l'imprimante → tout ce qui est inclus → formules et prix →
avis Google 5/5 → appel à l'action (phoevents.fr, téléphone, devis gratuit).

Voix off française (Chatterbox, licence MIT) générée par `tools/make_voice.py`, chaque phrase est vérifiée
par transcription automatique. Musique : « Funky Chunk » de Kevin MacLeod (incompetech.com), licence CC BY 4.0 :
**mettre en description de la publication** « Musique : Funky Chunk – Kevin MacLeod (incompetech.com) – CC BY 4.0 ».
La musique (volontairement basse) baisse encore quand la voix parle ; le son final est mis à -14 LUFS (`tools/master_audio.sh`). Bruitages originaux générés par `tools/make_audio.py`.

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (phrases, prix, avis, contact, couleurs, photos).
Le logo est dans `public/logo.png`, la musique et les bruitages dans `public/audio/`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:story / render:post / render:intro
npm run studio         # aperçu en direct dans le navigateur
```

## Modifier la voix off

Les phrases sont dans `tools/make_voice.py` (dictionnaire `LINES`). La vidéo s'adapte toute seule à leur durée.

```bash
pip install chatterbox-tts faster-whisper
python tools/make_voice.py voix-reference.wav          # toutes les phrases
python tools/make_voice.py voix-reference.wav cta      # une seule phrase
```

`voix-reference.wav` : 5 à 10 s d'une voix française dont on copie le timbre et l'accent.

## Effacer les personnes d'une photo

`tools/remove_people.py` détoure les personnes (rembg) puis reconstruit le décor (LaMa) :

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r tools/requirements.txt
python tools/remove_people.py photo.jpg photo-vide.jpg --shadow
```
