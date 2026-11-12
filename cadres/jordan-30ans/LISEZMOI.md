# Cadres photobooth : 30 ans de Jordan (21/11/2026), prêts pour LumaBooth

Les 3 modèles de base, fidèles à l'original, au format tirage 10×15 (300 dpi). Les cadres dorés gardent la même place, la même taille et la même inclinaison, mais ce sont maintenant de **vrais rectangles** : dans un même modèle, toutes les cases ont la même taille, avec des angles ronds. Les cases sont transparentes et les photos se placent par-dessous.

## Les réglages à taper dans LumaBooth

| Modèle | Page | Taille de chaque case | Angles |
|---|---|---|---|
| **1 photo** | Portrait (4×6 vertical) | **750 × 880** | −6° |
| **2 photos** | Portrait (4×6 vertical) | **520 × 740** (les 2 identiques) | case 1 : −8° · case 2 : +7° |
| **3 photos** | Paysage (4×6 horizontal) | **530 × 570** (les 3 identiques) | case 1 : −7° · case 2 : 0° · case 3 : +7° |

Les cases sont numérotées de gauche à droite. Elles dépassent de 10 px sous la dorure : ça laisse une petite marge d'erreur au placement, il suffit qu'aucun vide n'apparaisse dans la case.

## Mise en place à la main (5 minutes par modèle)

1. Copie le PNG du modèle (dossier `PNG/`) dans l'app **Fichiers** de l'iPad.
2. Dans LumaBooth, va dans **Print Layout** et crée une mise en page : papier **4×6**, orientation comme dans le tableau.
3. Ajoute une **Booth Photo** par case. Pour chacune, tape la **largeur**, la **hauteur** et l'**angle** du tableau.
4. Fais glisser chaque case sur sa zone, en t'aidant de l'image du guide (dossier `guides/`).
5. Ajoute une **Image**, choisis le PNG, étire-le sur toute la page et mets-le au premier plan avec **Bring forward**.
6. **2 photos uniquement** : le cadre de gauche passe devant celui de droite, donc la case 1 doit être au-dessus de la case 2.

Si une case penche à l'envers par rapport au cadre doré, inverse le signe de l'angle (−7 devient 7).

### Si LumaBooth n'affiche pas des pixels

Voici les mêmes valeurs en % de la largeur et de la hauteur de la page. « Gauche » et « Haut » donnent la position du coin supérieur gauche de la case avant rotation.

| Modèle | Case | Largeur | Hauteur | Gauche | Haut |
|---|---|---|---|---|---|
| 1 photo | 1 | 62,5 % | 48,9 % | 18,6 % | 8,7 % |
| 2 photos | 1 | 43,3 % | 41,1 % | 8,1 % | 10 % |
| 2 photos | 2 | 43,3 % | 41,1 % | 48,9 % | 11,1 % |
| 3 photos | 1 | 29,4 % | 47,5 % | 4,7 % | 15,2 % |
| 3 photos | 2 | 29,4 % | 47,5 % | 35,3 % | 8,5 % |
| 3 photos | 3 | 29,4 % | 47,5 % | 66,6 % | 14,9 % |

En pixels (page 1200×1800, ou 1800×1200 pour le 3 photos) :

| Modèle | Case | Gauche | Haut |
|---|---|---|---|
| 1 photo | 1 | 223 | 157 |
| 2 photos | 1 | 97 | 180 |
| 2 photos | 2 | 587 | 200 |
| 3 photos | 1 | 85 | 182 |
| 3 photos | 2 | 635 | 102 |
| 3 photos | 3 | 1198 | 179 |

## Ce qu'il y a dans le dossier

- `PNG/` : les cadres (PNG transparents), à mettre sur l'iPad.
- `guides/` : l'emplacement de chaque case (numéro, taille, angle).
- `apercus/` : le rendu avec des photos d'exemple, à montrer à Jordan.
- `LumaBooth/` : les mêmes modèles en .zip (format LumaBooth pour Windows / dslrBooth), si tu préfères essayer l'import.
- `sources/` : les fichiers d'origine.

## Ce qui a été amélioré par rapport aux fichiers d'origine

- **Cadres réguliers** : les cadres dessinés par l'IA avaient des côtés de longueurs et d'angles différents (jusqu'à 2° d'écart). Ils sont redessinés en vrais rectangles, avec la texture dorée d'origine.
- **Netteté** : agrandissement par IA (Real-ESRGAN) jusqu'à la taille d'impression, puis accentuation pour l'impression.
- **Marges** : sur le 2 photos d'origine, les dorures étaient à 1 mm du bord du papier et auraient été rognées à l'impression. Les deux cadres ont été rapprochés du centre (≈ 2,5 mm chacun), sans rien changer à leur taille ni à leur inclinaison. Le fond s'étire légèrement sur les côtés, et les perles et étoiles gardent leur forme. Dorures à 3 mm ou plus du bord sur les 3 modèles.
- **Décors** : sur le 3 photos, les flûtes de champagne et le ballon transparent passent toujours devant les photos, comme sur l'original.
- **Recadrage** : les cases gardent les proportions de l'original, et LumaBooth recadre automatiquement les photos du reflex (3:2). Avec la **borne en vertical** (conseillé pour les 3 modèles) :
  - sur le 2 photos, le format est presque exact ;
  - sur le 1 photo et le 3 photos, le haut et le bas des photos sont un peu coupés. Laisse un peu d'espace au-dessus des têtes au cadrage.
- **Tirage test** : imprime un tirage de chaque modèle avant le 21/11.

## Refaire ou modifier les modèles

Les scripts sont dans `tools/cadres_lumabooth/`. Ces modèles viennent de `fidele.py`, où les tailles, angles et ancrages sont définis dans `SPECS`.
