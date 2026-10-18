# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-story.mp4` | 1080×1920 · 27 s | Reel / Story Instagram, TikTok |
| `phoevents-post.mp4` | 1080×1080 · 27 s | Post Instagram / Facebook |
| `phoevents-intro.mp4` | 1920×1080 · 4 s | Intro logo YouTube, écran d'événement |

Vidéo promo du photobooth : accroche → fonds IA (boxe, film noir, safari) → impressions sur place →
cadre personnalisé → avis Google 5/5 → événements & prix → appel à l'action (phoevents.fr, téléphone).
Textes, photos et couleurs repris de phoevents.fr.

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (phrases, prix, avis, contact, couleurs, photos).
Les photos sont dans `public/photos/`, le logo dans `public/logo.png`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:story / render:post / render:intro
npm run studio         # aperçu en direct dans le navigateur
```
