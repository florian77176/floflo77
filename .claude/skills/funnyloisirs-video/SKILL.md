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

## Concept actuel : « POV : t'as transformé ton jardin 🤯 » (vraies photos plein écran)
Le 1er concept (structures détourées en « stickers » sur fond jaune) n'a pas plu : ça ne donnait pas envie de louer.
Ce qui marche : **les vraies photos du site en plein écran** (on voit la taille, on s'imagine chez soi), coupes franches
sur le temps avec « punch » de zoom et flash, gros sous-titres façon TikTok (blanc, contour noir, Baloo 2).
Déroulé (~18 s) : LEGO « POV : t'as transformé ton jardin 🤯 » + « LEGO géante · dès 450 € » → Château Safari World
(dès 280 €) → toboggan géant → parcours d'obstacles → bubble foot → lancer de hache → cible foot géante → Puissance 4
basket (dès 180 €) → « Et toi ? Tu profites 😎 » (on livre & on installe, matériel nettoyé & contrôlé, 5/5 · 25 avis)
→ logo, « Réserve ton week-end 🎉 », site, téléphone, devis 24h, « réserve 2 à 3 semaines avant ». Story : ~13 s.
**Ne pas mettre le photobooth** dans les vidéos Funny Loisirs.

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
| Plans photo (photo, cadrage, texte, prix, durée en temps) | `src/funny/promo.tsx` (`SHOTS`) |
| Scènes « Tu profites » et appel à l'action, montage, version story | `src/funny/promo.tsx` |
| Contact, couleurs, musique | `src/funny/config.ts` · fond jaune et pastilles : `src/funny/parts.tsx` |
| Couverture | composition `Funny-Cover` (1re scène, zone `cover`) |
| Bruitages (boing, confetti…) | `tools/make_audio.py` (`sfx_funny`) |

Rendu : `sh tools/render_funny.sh /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
→ `videos/funnyloisirs/<réseau>/`. Vérifier des images fixes de chaque scène (et le cadre visible par réseau) avant d'envoyer.
