# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-reel.mp4` | 1080×1920 · 27 s | **Version principale** : Reel / TikTok, musique, sans voix |
| `phoevents-reel-sans-musique.mp4` | 1080×1920 · 27 s | Pour ajouter un son tendance dans Instagram / TikTok |
| `phoevents-reel-voix-homme.mp4` | 1080×1920 · 34 s | Variante avec voix off masculine |
| `phoevents-post.mp4` | 1080×1080 · 27 s | Post Instagram / Facebook |
| `phoevents-reel-couverture.png` | 1080×1920 | Couverture du reel (contenu dans la zone 4:5 du profil) |
| `phoevents-intro.mp4` | 1920×1080 · 4 s | Intro logo YouTube, écran d'événement |

Concept « Tu choisis lequel ? » : accroche → 4 cadres d'exemple numérotés (mariage, anniversaire, baby shower,
entreprise) → récap des 4 + « Commente ton numéro 👇 » (pour faire réagir en commentaires) → tirage imprimé sur place →
prix, avis Google, appel à l'action. Toutes les coupes tombent sur les temps de la musique (117 BPM).

Musique : « Funky Chunk » de Kevin MacLeod (incompetech.com), licence CC BY 4.0 :
**mettre en description de la publication** « Musique : Funky Chunk – Kevin MacLeod (incompetech.com) – CC BY 4.0 ».
Son final mis à -14 LUFS (`tools/master_audio.sh`). Bruitages originaux générés par `tools/make_audio.py`.

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (section `reel` : accroche, cadres, prix, appel à l'action ; section `music`).
Le logo est dans `public/logo.png`, la musique et les bruitages dans `public/audio/`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:reel / render:sans-musique / render:voix / render:post / render:intro
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
