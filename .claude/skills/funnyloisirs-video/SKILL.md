---
name: funnyloisirs-video
description: Créer, modifier ou régénérer les vidéos réseaux sociaux de Funny Loisirs (location de structures gonflables et jeux géants, funnyloisirs.fr) — reels, TikTok, stories, Snapchat, Facebook. À utiliser dès qu'on parle de vidéo, pub, reel ou story pour Funny Loisirs / funnyloisirs.fr.
---

# Vidéos Funny Loisirs

Même projet Remotion que Pho Events (voir la compétence `phoevents-video` pour les outils communs : rendu,
zones visibles `SAFE_ZONES`, mastering audio). Code propre à la marque : `src/funny/`.
Le client ne veut rien faire soi-même : on fait tout, on vérifie, on rend, on envoie, on commit, on pousse.

## Marque (reprise de funnyloisirs.fr)
- Location de structures gonflables, jeux géants et animations. Savigny-le-Temple (77), Seine-et-Marne & Île-de-France.
- Tél. 07 83 80 57 14 · funnyloisirs.fr · Instagram @funnyloisirs · TikTok @funny.loisirs · facebook.com/funny.loisirs
- 5,0/5, 25 avis Google · devis gratuit sous 24h · livraison/installation possibles · matériel nettoyé et contrôlé.
- Prix « dès » (site) : LEGO géante 450 €, Château Safari World 280 €, Parc des animaux 250 €, Curling 200 €,
  Puissance 4 basket 180 €, Photobooth Pho Events 180 €. Autres : bubble foot, sumo, cible hache (Tomahawk),
  cible foot, cornhole (sans prix affiché). Ne rien inventer.
- Couleurs : jaune `#FCDB5D`, rouge `#FE3030`, orange `#FDAF00`, noir `#161616`. Police : Baloo 2 (écrite entre
  guillemets en CSS car le nom contient un chiffre : utiliser `rounded` de `src/fonts.ts`).

## Concept actuel : photos 3D animées + annotations (version 3)
Historique : 1) stickers détourés sur fond jaune → « pas fou » ; 2) photos fixes plein écran → « pas fou » (diaporama).
Version 3 : chaque photo devient un **clip « photo 3D »** (effet zoom 3D façon CapCut : la caméra avance, le premier plan
grossit plus vite que le fond grâce à une carte de profondeur), avec des **annotations dessinées** qui suivent le
mouvement : traits de mesure avec les **vraies hauteurs du site** et flèches vers les détails.
Déroulé (~22 s) : « Une structure de **5,3 MÈTRES** de haut 🤯 » sur la LEGO (+ trait 5,3 m, « LEGO géante · dès 450 € »)
→ Château Safari World (trait 3,9 m, flèche « toboggan », « dès 280 € · ~9 enfants ») → « Ça glisse 🛝 » → parcours
d'obstacles → Puissance 4 basket (3,7 m, dès 180 €) → lancer de hache → bubble foot (jusqu'à 10 adultes) → cible foot
géante → « Les enfants : 🤩 / Toi : 😎 » + on livre/installe/reprend, nettoyé & contrôlé, 5/5 · 25 avis → appel à l'action.
**Ne pas mettre le photobooth** dans les vidéos Funny Loisirs.

Caractéristiques (site) : LEGO géante 9,5 × 4 m, **5,3 m** de haut, ~10 enfants, dès 6 ans, toboggan + mur d'escalade ;
Safari World 5,4 × 5 m, **3,9 m**, ~9 enfants, dès 3 ans ; Puissance 4 basket **3,7 m** ; cible hache 3 m ;
cible foot 2,5 m ; bubble foot 10 adultes max. (Page LEGO : /structure-gonflable-geante/.)

Fabrication des clips 3D :
1. `python tools/depth.py <dossier> public/funny/photos/*.jpg` (Depth Anything V2 Small, `transformers`)
2. `python tools/parallax.py photo.jpg photo-depth.png public/funny/clips/<nom>.mp4 focus_x focus_y orbite`
3. Positions d'annotations : en fraction de l'écran 1080×1920 sur la 1re image ; profondeur de chaque point via
   `python tools/anchor_depth.py photo depth focus_x focus_y x,y …` → valeurs `d` dans `SHOTS` (`src/funny/promo.tsx`).
   `orbit` dans `SHOTS` = même valeur qu'à l'étape 2.

## Règles
- **Jamais de photos où l'on voit des enfants** (mineurs). Préférer les photos de structures seules.
- Photos : versions HD du site, orientation EXIF corrigée, ≤ 2400 px de haut, dans `public/funny/photos/`.
  Photo trop petite → `tools/upscale.py` (Real-ESRGAN x4 via `spandrel`, modèle `RealESRGAN_x4plus.pth` des releases
  GitHub de xinntao/Real-ESRGAN). Attention : la photo « IMG_9092 » montre un tapis air-track bleu, **pas** le curling ;
  la photo Puissance 4 « photo-puissance-4-basket-2 » porte un filigrane leboncoin (ne pas l'utiliser).
- Musique : « Who Likes to Party », Kevin MacLeod (incompetech.com), **CC BY 4.0** → crédit en fin de vidéo et
  dans la description des publications.

## Où modifier quoi
| Quoi | Fichier |
|---|---|
| Plans (clip 3D, texte, prix, annotations, durée en temps) | `src/funny/promo.tsx` (`SHOTS`) · rendu 3D + annotations : `src/funny/clip3d.tsx` |
| Scènes « Tu profites » et appel à l'action, montage, version story | `src/funny/promo.tsx` |
| Contact, couleurs, musique | `src/funny/config.ts` · fond jaune et pastilles : `src/funny/parts.tsx` |
| Couverture | composition `Funny-Cover` (1re scène, zone `cover`) |
| Bruitages (boing, confetti…) | `tools/make_audio.py` (`sfx_funny`) |

Rendu : `sh tools/render_funny.sh /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
→ `videos/funnyloisirs/<réseau>/`. Vérifier des images fixes de chaque scène (et le cadre visible par réseau) avant d'envoyer.
