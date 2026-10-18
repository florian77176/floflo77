# PhoEvents — Vidéos motion design

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev).

## Vidéos prêtes (dossier `videos/`)

| Fichier | Format | Usage |
|---|---|---|
| `phoevents-story.mp4` | 1080×1920 · 14 s | Story / Reel Instagram, TikTok |
| `phoevents-post.mp4` | 1080×1080 · 14 s | Post Instagram / Facebook |
| `phoevents-intro.mp4` | 1920×1080 · 5 s | Intro logo YouTube, écran d'événement |

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (nom, slogan, couleurs, titre, date, heure, lieu, bouton, @compte).
Pour utiliser un vrai logo : déposer `public/logo.png` et mettre `logo: 'logo.png'`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # ou render:story / render:post / render:intro
npm run studio         # aperçu en direct dans le navigateur
```
