# Cadres photobooth : 30 ans de Jordan (21/11/2026), prêts pour LumaBooth

4 modèles au format tirage 10×15 (300 dpi). Les cadres dorés ont été **redessinés en vrais rectangles** : dans un même modèle, toutes les cases ont la même taille et un angle rond. Les cases sont transparentes et les photos se placent par-dessous.

| Modèle | Page | Cases photo (taille de la case LumaBooth) | Angles | Borne |
|---|---|---|---|---|
| `Jordan30_1photo` | Portrait 1200×1800 | 1 case de **660 × 980** | −5° | Verticale |
| `Jordan30_2photos` | Portrait 1200×1800 | 2 cases de **500 × 740** | −5° et +5° | Verticale |
| `Jordan30_3photos` | Paysage 1800×1200 | 3 cases de **420 × 620** | −5°, 0°, +5° | Verticale |
| `Jordan30_3photos_creme` | Portrait 1200×1800 | 2 cases de **560 × 454** + 1 de **1068 × 534** | 0° (droit) | Horizontale |

Sur les trois modèles bleu nuit, la partie visible de chaque case est exactement au format 2:3 (400×600, 480×720, 640×960). Une photo de reflex prise **borne verticale** y entre donc entière, sans recadrage.

## Ce qu'il y a dans le dossier

- `LumaBooth/` : les 4 modèles à importer (.zip, à ne pas décompresser).
- `PNG/` : les cadres seuls (PNG transparents), pour la mise en place à la main.
- `guides/` : l'emplacement de chaque case (numéro, taille, angle).
- `apercus/` : le rendu avec des photos d'exemple, à montrer à Jordan.
- `sources/` : les fichiers d'origine.

## Mise en place à la main dans LumaBooth

1. Copie le PNG du modèle dans l'app **Fichiers** de l'iPad.
2. Dans LumaBooth, va dans **Print Layout** et crée une mise en page : papier **4×6**, orientation comme dans le tableau.
3. Ajoute une **Booth Photo** par case (1, 2, 3 dans l'ordre de lecture). Pour chacune, saisis **la largeur, la hauteur et l'angle du tableau**. Dans un même modèle, toutes les cases ont la même taille (sauf la grande du crème).
4. Fais glisser chaque case sur sa zone, en t'aidant du guide (`guides/`). Les cases dépassent de 10 px sous la dorure, ce qui laisse une petite marge d'erreur : il suffit qu'aucun vide n'apparaisse dans la case.
5. Ajoute une **Image**, choisis le PNG, étire-le sur toute la page et mets-le au premier plan avec **Bring forward**.
6. Sur le **2 photos**, le cadre de gauche passe devant celui de droite : la case 1 doit être au-dessus de la case 2.

**Si les cases penchent à l'envers** par rapport aux cadres dorés, inverse le signe de l'angle (−5 devient 5).

**Si LumaBooth n'utilise pas les pixels**, voici les mêmes valeurs en % de la largeur et de la hauteur de la page :

| Modèle | Case | Largeur | Hauteur | Gauche | Haut |
|---|---|---|---|---|---|
| 1 photo | 1 | 55 % | 54,4 % | 22,5 % | 4,6 % |
| 2 photos | 1 | 41,7 % | 41,1 % | 7,2 % | 10,6 % |
| 2 photos | 2 | 41,7 % | 41,1 % | 51,2 % | 10,6 % |
| 3 photos | 1 | 23,3 % | 51,7 % | 5,2 % | 12,1 % |
| 3 photos | 2 | 23,3 % | 51,7 % | 38,3 % | 4,7 % |
| 3 photos | 3 | 23,3 % | 51,7 % | 71,5 % | 12,1 % |
| crème | 1 | 46,7 % | 25,2 % | 2,8 % | 4,2 % |
| crème | 2 | 46,7 % | 25,2 % | 50,7 % | 4,2 % |
| crème | 3 | 89 % | 29,7 % | 5,5 % | 30,2 % |

« Gauche » et « Haut » donnent la position du coin supérieur gauche de la case avant rotation.

## Import du .zip (autre possibilité)

Les .zip sont au format LumaBooth pour Windows (dslrBooth) : `template.xml` + PNG. Envoie-le sur l'iPad, ouvre-le avec LumaBooth (ou **Print Layout → Import**) et vérifie que les cases tombent bien dans les cadres.

## Bon à savoir

- **Marges** : les imprimantes photobooth rognent 1,5 à 2 mm sur chaque bord. Les dorures sont à 4 mm ou plus du bord sur les modèles bleu nuit. Sur le crème, elles sont à 2,2–2,5 mm, comme dans son dessin d'origine : contrôle-le sur un tirage test.
- **Modèle crème** : ses cadres droits recouvrent exactement les anciens. Le fond aquarelle reste donc intact, mais les cases gardent leurs proportions d'origine. Avec un reflex en horizontal :
  - les deux petites photos sont un peu recadrées sur les côtés ;
  - la grande photo panoramique est recadrée en haut et en bas. Laisse de la place au-dessus des têtes.
- **Décors** : les verres, les ballons et le ruban qui touchaient les anciens cadres passent maintenant derrière les nouveaux.
- **Qualité** : cadres agrandis par IA (Real-ESRGAN) à la taille d'impression, puis accentués pour l'impression. La dorure est la texture d'origine.
- **Tirage test** : imprime un tirage de chaque modèle que tu utilises avant le 21/11.

## Refaire ou modifier les modèles

Les scripts sont dans `tools/cadres_lumabooth/`. Les cadres réguliers viennent de `regulier.py`, où les cases sont définies dans `SPECS`.
