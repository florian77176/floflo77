---
name: musique-video
description: Superviseur et monteur musique pour vidéos courtes (Reels, TikTok, Shorts, stories) — choisir une musique libre de droits adaptée (licences), « l'écouter » sans oreille grâce à l'IA (humeur, style, voix, tempo, drop), caler le montage sur le rythme et le drop sur la révélation, risers/impacts, mixage et niveau final, versions sans musique pour les sons tendance. À utiliser dès qu'il faut choisir, changer, caler ou mixer une musique de vidéo.
---

# Musique de vidéo courte, niveau pro

## 1. Droits (non négociable)
- Jamais de musique commerciale (chansons connues) dans le fichier livré : risque de blocage/suppression.
- Sources sûres utilisées dans ce projet :
  - **Mixkit** (mixkit.co, licence « Stock Music Free ») : usage commercial et réseaux sociaux autorisés,
    crédit non requis. Aperçus complets : `https://assets.mixkit.co/music/<id>/<id>.mp3`.
  - **Incompetech / Kevin MacLeod** (CC BY 4.0) : crédit obligatoire (fin de vidéo + description).
  - Pixabay et Chosic sont bloqués depuis cet environnement (403).
- Sons tendance TikTok/Instagram : ils s'ajoutent **dans l'application** (licence de la plateforme).
  Toujours livrer aussi une **version sans musique** (bruitages conservés) pour ça : c'est le meilleur levier de portée.

## 2. Choisir sans pouvoir écouter
`python tools/listen.py morceaux*.mp3` (env `/home/user/ai-env`) donne pour chaque morceau : tempo, énergie, « punch »,
basses, drops (hausse d'énergie entre phrases de 8 temps) et les étiquettes AudioSet du modèle AST
(humeur : Happy / Exciting / Funny / Sad…, style : House, Funk, Pop…, voix : Singing / Rapping).
Repères :
- Révélation / « waouh » : house ou électro avec basses (bass > 0,2) et drop net (ratio > 1,3).
- Enfants / anniversaire : Happy + Exciting élevés, joueur (piano, ukulélé), 120–150 BPM, pas niais.
- Adultes / défi / humour : funk ou hip-hop avec punch (> 1,8), un peu « Funny ».
- Coulisses / process : groove régulier, énergie dès le début.
- Éviter : Sad/Tender élevés, intro calme de > 2 s si l'accroche est au début, voix chantée qui couvre le texte.
Toujours dire honnêtement au client qu'on ne peut pas écouter et lui demander son avis.

## 3. Caler le montage sur la musique
- Grille : durée d'un temps = (début dernière mesure − début première mesure) / (nb mesures × 4)
  (plus fiable que le tempo global sur la durée). Toutes les durées de plans en **nombre de temps**.
- **Drop sur la révélation** : `start = t_drop − (instant de la révélation dans la vidéo)` ; vérifier que start ≥ 0
  et que la musique à `start` n'est pas un silence.
- **Riser** (1,6 s) qui finit pile sur le drop + **impact** (avec secousse de caméra) au drop.
- Variante : démarrer directement sur un drop pour avoir de l'énergie dès la 1re image.
- Finir sur une fin de phrase musicale (multiple de 4 temps) avec un fondu court (≈ 0,6 s).

## 4. Mixage
musique ≈ 0,75 (0,35 sous une voix, 0,18 pendant qu'elle parle) · bruitages ≈ 0,4–0,5 relatif ·
mastering final **−14 LUFS**, crête −1 dB (`tools/master_audio.sh`). Vérifier : `ffmpeg -af ebur128`.

## 5. Dans ce projet
Musiques dans `public/audio/` (préfixe `mixkit-` = Mixkit). Réglages par épisode : `music: {file, start, beat}` dans
`src/funny/episodes.ts` (commentaire = position du drop). Bruitages générés : `tools/make_audio.py`.
