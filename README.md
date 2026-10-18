# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-story.mp4` | 1080×1920 · 33 s | Reel / Story Instagram, TikTok |
| `phoevents-post.mp4` | 1080×1080 · 33 s | Post Instagram / Facebook |
| `phoevents-intro.mp4` | 1920×1080 · 4 s | Intro logo YouTube, écran d'événement |

Vidéo promo du photobooth, sans aucune personne à l'écran : accroche → décors IA vides (compte à rebours 3-2-1 + flash) →
cadres personnalisés par type d'événement (mariage, anniversaire, baptême, entreprise) → tirage qui sort de l'imprimante →
avis Google 5/5 → événements & prix → appel à l'action (phoevents.fr, téléphone).

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (phrases, prix, avis, contact, couleurs, photos).
Les décors sont dans `public/decors/`, le logo dans `public/logo.png`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:story / render:post / render:intro
npm run studio         # aperçu en direct dans le navigateur
```

## Effacer les personnes d'une photo

`tools/remove_people.py` détoure les personnes (rembg) puis reconstruit le décor (LaMa) :

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r tools/requirements.txt
python tools/remove_people.py photo.jpg photo-vide.jpg --shadow
```
