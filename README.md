# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-story.mp4` | 1080×1920 · 35 s | Reel / Story Instagram, TikTok |
| `phoevents-post.mp4` | 1080×1080 · 35 s | Post Instagram / Facebook |
| `phoevents-intro.mp4` | 1920×1080 · 4 s | Intro logo YouTube, écran d'événement |

Déroulé : accroche → compte à rebours « 3, 2, 1, Souriez ! » → 5 exemples de cadres avec emplacements photo
(mariage, anniversaire, baptême, baby shower, entreprise) → tirage qui sort de l'imprimante → tout ce qui est inclus →
formules et prix → avis Google 5/5 → appel à l'action (phoevents.fr, téléphone).

Musique et bruitages originaux (libres de droits), générés par `tools/make_audio.py`.

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (phrases, prix, avis, contact, couleurs, photos).
Le logo est dans `public/logo.png`, la musique et les bruitages dans `public/audio/`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:story / render:post / render:intro
npm run studio         # aperçu en direct dans le navigateur
```

## Recomposer la musique

```bash
pip install numpy scipy
python tools/make_audio.py 35.4   # durée en secondes
```

## Effacer les personnes d'une photo

`tools/remove_people.py` détoure les personnes (rembg) puis reconstruit le décor (LaMa) :

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r tools/requirements.txt
python tools/remove_people.py photo.jpg photo-vide.jpg --shadow
```
