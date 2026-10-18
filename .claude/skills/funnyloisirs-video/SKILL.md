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

## Concept validé : « Laquelle tu choisis pour ta fête ? 🎈 »
Accroche lisible dès la 1re image → 4 structures numérotées qui **se gonflent** (sticker détouré à contour blanc,
bruit de soufflerie, boing, confettis, badge Nouveau/Best-seller, prix) puis se dégonflent → « Ou… les 4 ? 😏 » +
« Commente ton numéro 👇 » → occasions → avis, devis 24h, appel à l'action. Coupes sur les temps (117 BPM).
Story (~17 s) : place laissée pour un sticker Sondage.

## Règles
- **Jamais de photos où l'on voit des enfants** (mineurs). Préférer les photos de structures seules.
- Détourage : `rembg` modèle `isnet-general-use` sur les photos HD du site ; nettoyer (bâche noire sous le Safari
  enlevée par seuil couleur, garder la plus grande composante). La cible Tomahawk se détoure mal (cadre noir perdu).
- Musique : « Who Likes to Party », Kevin MacLeod (incompetech.com), **CC BY 4.0** → crédit en fin de vidéo et
  dans la description des publications.

## Où modifier quoi
| Quoi | Fichier |
|---|---|
| Structures, prix, textes, musique | `src/funny/config.ts` |
| Scènes | `src/funny/scenes.tsx` · éléments visuels : `src/funny/parts.tsx` |
| Ordre / durée des scènes | `src/funny/FunnyReel.tsx` (`STEPS`) · couverture : `src/funny/FunnyCover.tsx` |
| Bruitages (inflate, boing, confetti) | `tools/make_audio.py` (`sfx_funny`) |

Rendu : `sh tools/render_funny.sh /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
→ `videos/funnyloisirs/<réseau>/`. Vérifier des images fixes de chaque scène (et le cadre visible par réseau) avant d'envoyer.
