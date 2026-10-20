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

## Série actuelle : vraies vidéos du compte TikTok (version 4)
Historique : stickers sur fond jaune → photos fixes → photos 3D : tout jugé « pas fou ». Ce qui manquait : du **vrai
mouvement filmé**. On utilise maintenant les rushs du compte TikTok public **@funny.loisirs** (72 vidéos,
`yt-dlp --impersonate chrome`), préparés par `tools/build_clips.py` (manifeste `tools/clips_manifest.json`,
durées dans `src/funny/footage-durations.json`). Méthode générale : compétence **montage-pro**.

Série (`src/funny/episodes.ts`, moteur `src/funny/series.tsx`, un MP4 9:16 « universel » par épisode, ≤ 20 s) :
1. **avant-apres** — terrain vide → rempli, gonflages en accéléré (chrono « 1 minute », chiffre tiré de leur légende TikTok).
2. **top3-anniversaire** — « Tu choisis laquelle ? 1, 2 ou 3 » : Animal Land, Safari World, LEGO géante (riser avant le n°3).
3. **adultes** — « Que pour les enfants ? RATÉ 😈 » : cible foot, Puissance 4 basket, sumos → CE / team building.
4. **coulisses** — charger, livrer, installer, gonfler, sécuriser → « Tu profites 😎 » (leur vidéo la plus vue = vlog).
Descriptions SEO + calendrier : `videos/funnyloisirs/serie/DESCRIPTIONS.md`. Rendu : `sh tools/render_series.sh <chrome>`.
Idées de choix des formats : transformation/satisfying (n°1 du secteur), question en commentaire, coulisses du service,
mots-clés locaux dans le texte à l'écran et la légende (Instagram et TikTok les indexent), 3–5 hashtags.

Pour un nouvel épisode : repérer les passages (planches 1 image/s), ajouter les extraits au manifeste, lancer
`build_clips.py`, écrire l'épisode dans `episodes.ts` (durées en temps musicaux), vérifier des images fixes, rendre.
Éviter les passages avec texte incrusté d'origine (« POV… », titres) et les enfants reconnaissables.

## Règles
- **Jamais de photos où l'on voit des enfants** (mineurs). Préférer les photos de structures seules.
- Photos : versions HD du site, orientation EXIF corrigée, ≤ 2400 px de haut, dans `public/funny/photos/`.
  Photo trop petite → `tools/upscale.py` (Real-ESRGAN x4 via `spandrel`, modèle `RealESRGAN_x4plus.pth` des releases
  GitHub de xinntao/Real-ESRGAN). Attention : la photo « IMG_9092 » montre un tapis air-track bleu, **pas** le curling ;
  la photo Puissance 4 « photo-puissance-4-basket-2 » porte un filigrane leboncoin (ne pas l'utiliser).
- Musiques de la série : Mixkit (crédit non requis) choisies avec `tools/listen.py` : House Fest (avant/après),
  Fun Times (anniversaire), Funkee Monkeee (adultes), Midnight Funk (coulisses). Anciennes vidéos : Kevin MacLeod
  (CC BY 4.0, crédit obligatoire). Chaque épisode existe aussi **sans musique** (`serie/sans-musique/`).

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
