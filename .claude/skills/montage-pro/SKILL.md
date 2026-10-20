---
name: montage-pro
description: Méthode de monteur vidéo haut de gamme pour vidéos courtes réseaux sociaux (Reels, TikTok, Shorts, stories) — accroche, rythme, coupes sur le temps, speed ramps, sound design, sous-titres animés, étalonnage, formats de séries (Top 3, avant/après, satisfying, POV), récupération et traitement des rushs (TikTok, upscale, recadrage 9:16), contrôle qualité. À utiliser pour toute création ou amélioration de vidéo marketing courte (Pho Events, Funny Loisirs ou autre).
---

# Montage vidéo court, niveau pro

Objectif : une vidéo qu'on ne zappe pas, qu'on regarde jusqu'au bout, qu'on commente et qui donne envie d'acheter.
Toujours partir de **vraies images** (rushs du client) avant les photos ; les photos seules donnent un diaporama.

## 1. Structure qui retient
- **0–1 s : accroche** lisible dès la 1re image (pas de fondu depuis le noir) : chiffre fort (« 5,3 m »), promesse
  (« TOP 3… »), question, POV, ou image spectaculaire (gonflage, drone). L'image d'accroche sert d'aperçu dans le fil.
- **Rupture toutes les 1–2 s** : nouveau plan, zoom, texte, son. Plan le plus long ≈ 2,5 s sauf moment « satisfying ».
- **Boucle ouverte** : annoncer la suite (« le n°1 va te choquer ») et la payer à la fin (garde jusqu'au bout).
- **Fin = appel à l'action unique** + question pour les commentaires (« 1, 2 ou 3 ? 👇 »). Durée cible 15–25 s.
- Fin qui **boucle** visuellement avec le début quand c'est possible (revisionnages).

## 2. Rythme et coupes
- Couper **sur les temps** de la musique (détecter BPM/temps avec librosa) ; gros changements sur les temps forts.
- **Speed ramps** : accélérer les attentes (installation, gonflage ×3–×8), ralentir le moment clé (chute, impact).
- **Punch-in** (zoom 1,15→1 en 6 images) à chaque coupe ; **match cut** quand deux plans ont la même forme/le même mouvement.
- Éviter les fondus enchaînés lents ; préférer coupe franche + flash bref ou whip (sans flou visible prolongé).

## 2 bis. Effets de monteur (implémentés dans `src/funny/series.tsx` et `tools/build_clips.py`)
- **Velocity edit** (rampe de vitesse) : `"ramp": [[fin, durée_s], …]` dans le manifeste (démarre, file, ralentit sur
  la révélation) + `fit: true` dans le plan.
- **Secousse de caméra** automatique sur chaque bruitage `impact` (≈ 0,35 s, amortie).
- **Pulsation sur le temps** (zoom +1,4 % décroissant à chaque temps) et **punch-in** à chaque coupe.
- **Drop sur la révélation** + riser avant (voir compétence musique-video).
- 1re image : texte d'accroche déjà affiché (pas d'animation qui démarre de zéro sur le 1er plan).
- Vérifier chaque extrait : aucun texte incrusté d'origine (« POV… »), sinon autre passage ou recadrage.

## 3. Sound design (couches)
musique (−14 LUFS au final) + whoosh sur coupes + impact/boom sur révélations + riser avant le n°1 + pop sur textes
+ « tic » de compteur. Baisser la musique sous une voix. Bruitages discrets : ils soutiennent, ils ne couvrent pas.

## 4. Texte à l'écran
- Gros, court (≤ 6 mots par écran), police ronde et grasse, blanc contour noir ou pastille de couleur de marque.
- Apparition animée (pop/échelle) synchronisée au son ; un seul message à la fois.
- **Zones visibles** : rien d'important dans le haut (~12 %), le bas (~25 %) ni sur la colonne droite (boutons).
  Un seul fichier pour tous les réseaux → zone commune Instagram/TikTok/Snap (≈ 130 px de chaque côté, 220 en haut, 480 en bas).
- Chiffres et prix vérifiés sur le site du client. Jamais d'info inventée.

## 5. Image
- Rushs TikTok = 576×1024 : `hqdn3d` léger → mise à l'échelle lanczos 1080×1920 → `unsharp` (Real-ESRGAN trop lent
  sur CPU pour de la vidéo ; le garder pour les photos). Éviter tout flou ajouté (le client le remarque).
- Étalonnage léger et cohérent : contraste +5 %, saturation +10–15 %, un peu de chaleur ; pas de look délavé.
- Pas de texte incrusté d'origine (choisir des passages propres), pas d'enfants reconnaissables sans accord.

## 6. Formats de séries qui marchent (alimenter les réseaux)
Top 3 (compte à rebours 3→1, le meilleur à la fin) · Ça se gonfle en X secondes (satisfying, compteur) ·
Avant / Après (même cadrage, coupe sur le temps) · POV · Combien ça coûte ? · Coulisses / livraison ·
Défi entre adultes · « Pour qui ? » (enfants / ados / entreprises).

## 7. Compétences liées
**musique-video** (choix, droits, calage, mixage) · **croissance-reseaux** (stratégie, accroches, légendes, tests).

## 8. Chaîne technique (ce projet)
- Rushs : `yt-dlp --impersonate chrome` (paquet `curl_cffi`) sur le compte TikTok public du client
  (Instagram/Facebook bloquent sans connexion). Planches contact (10 images/vidéo) pour repérer les passages.
- Extraits : `tools/extract_clip.sh` (découpe, vitesse, recadrage 9:16, débruitage, 1080×1920, netteté, étalonnage).
- Montage : Remotion (`src/…`), clips via `OffthreadVideo`, coupes calées sur `beatSec`.
- Contrôle : images fixes de chaque scène, zones visibles, transcription si voix, −14 LUFS (`tools/master_audio.sh`).
