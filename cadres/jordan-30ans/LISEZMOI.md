# Cadres photobooth : 30 ans de Jordan (21/11/2026), prêts pour LumaBooth

4 modèles au format tirage 10×15 (300 dpi), avec les cases photo transparentes et les photos placées par-dessous.

| Modèle | Format | Photos | Orientation conseillée de la borne |
|---|---|---|---|
| `Jordan30_1photo` | Portrait 1200×1800 | 1 | Verticale |
| `Jordan30_2photos` | Portrait 1200×1800 | 2 | Verticale |
| `Jordan30_3photos` | Paysage 1800×1200 | 3 | Verticale (moins de recadrage) |
| `Jordan30_3photos_creme` | Portrait 1200×1800 | 3 | Horizontale |

## Ce qu'il y a dans le dossier

- `LumaBooth/` : **les 4 modèles à importer** (.zip). Il ne faut pas les décompresser.
- `apercus/` : le rendu avec des photos d'exemple, que tu peux montrer à Jordan.
- `guides/` : l'emplacement de chaque case photo (numéro, taille, angle). Sert à la méthode manuelle.
- `PNG/` : les cadres seuls (PNG transparents), pour la méthode manuelle.
- `sources/` : les fichiers d'origine.

## Méthode 1 : importer le modèle (recommandée)

1. Envoie le .zip sur l'iPad : AirDrop, mail, Google Drive ou Dropbox.
2. Ouvre le fichier et choisis **« Ouvrir avec LumaBooth »**. Autre possibilité : dans LumaBooth, va dans **Print Layout → Import**, puis choisis le .zip.
3. Vérifie trois points dans l'éditeur :
   - le papier est en **4×6 (10×15)**, dans la bonne orientation (portrait ou paysage, voir le tableau) ;
   - les cases photo sont **penchées dans le même sens que les cadres dorés**. Si une case penche à l'envers, inverse le signe de son angle (par exemple −6 devient 6) ;
   - le cadre (l'image) est **au-dessus** des cases photo.
4. Fais une session test, puis **imprime un tirage** pour contrôler avant le jour J.

Si l'import ne passe pas, utilise la méthode 2. Pour avoir un import en un clic, exporte n'importe quel modèle depuis LumaBooth (**Print Layout → Export**) et envoie-le : le format exact de ta version pourra alors être reproduit.

## Méthode 2 : monter le modèle à la main (secours)

1. Copie le PNG du modèle dans l'app **Fichiers** de l'iPad.
2. Dans LumaBooth, crée une nouvelle mise en page (**Print Layout**) : papier 4×6, orientation comme dans le tableau.
3. Ajoute une **Booth Photo** par case (1, 2, 3, dans l'ordre). Pour chacune, saisis la largeur, la hauteur et l'angle du tableau ci-dessous, puis fais-la glisser sur la zone de même numéro du guide.
4. Ajoute une **Image**, choisis le PNG, et étire-la sur toute la page. Mets-la au premier plan avec **Bring forward**.
5. Les cases dépassent un peu sous la bordure dorée. Il n'y a donc pas besoin d'être précis au pixel près : il suffit qu'aucun vide n'apparaisse dans les cases.

Les valeurs sont en pixels pour une page de 1200×1800 (ou 1800×1200). Entre parenthèses, la même valeur en % de la page, si LumaBooth utilise une autre unité. « Gauche » et « Haut » donnent la position du rectangle avant rotation.

### `Jordan30_1photo` (portrait)

| Case | Largeur | Hauteur | Angle | Gauche | Haut |
|---|---|---|---|---|---|
| 1 | 765 (63,8 %) | 891 (49,5 %) | −6° | 218 (18,2 %) | 152 (8,4 %) |

### `Jordan30_2photos` (portrait)

| Case | Largeur | Hauteur | Angle | Gauche | Haut |
|---|---|---|---|---|---|
| 1 | 528 (44 %) | 745 (41,4 %) | −5,5° | 83 (6,9 %) | 184 (10,2 %) |
| 2 | 522 (43,5 %) | 740 (41,1 %) | 4,6° | 603 (50,2 %) | 211 (11,7 %) |

Le cadre de gauche passe par-dessus celui de droite. La case 1 doit donc être **au-dessus** de la case 2 (à mettre avec Bring forward / Send backward).

### `Jordan30_3photos` (paysage)

| Case | Largeur | Hauteur | Angle | Gauche | Haut |
|---|---|---|---|---|---|
| 1 | 549 (30,5 %) | 594 (49,5 %) | −7,4° | 73 (4,1 %) | 161 (13,4 %) |
| 2 | 527 (29,3 %) | 560 (46,7 %) | −1° | 637 (35,4 %) | 107 (8,9 %) |
| 3 | 550 (30,6 %) | 601 (50,1 %) | 6,2° | 1183 (65,7 %) | 153 (12,8 %) |

### `Jordan30_3photos_creme` (portrait)

| Case | Largeur | Hauteur | Angle | Gauche | Haut |
|---|---|---|---|---|---|
| 1 | 564 (47 %) | 453 (25,2 %) | −1,5° | 35 (2,9 %) | 78 (4,3 %) |
| 2 | 567 (47,2 %) | 458 (25,4 %) | 0,3° | 604 (50,3 %) | 74 (4,1 %) |
| 3 | 1079 (89,9 %) | 539 (29,9 %) | −0,2° | 60 (5 %) | 542 (30,1 %) |

## Bon à savoir

- **Marges de sécurité** : les imprimantes photobooth rognent 1,5 à 2 mm sur chaque bord d'un tirage 10×15 sans marge. Les dorures des cadres sont donc gardées loin des bords :

  | Modèle | Distance entre la dorure et le bord |
  |---|---|
  | 1 photo | 10 mm et plus |
  | 2 photos | 4 mm |
  | 3 photos paysage | 3,3 mm |
  | 3 photos crème | 2,4 mm |

  Sur le **2 photos**, le dessin d'origine plaçait les dorures à 1 mm du bord : elles auraient été rognées. Les deux cadres ont donc été légèrement redressés (−5,5° et 4,6° au lieu de −8° et 7°) pour s'éloigner des bords. Le fond et les décors (rubans, coups de pinceau, étoiles, verres, ballons) n'ont pas bougé.

  Le **crème** est le plus juste. Il garde au moins 0,5 mm de bleu après la coupe de l'imprimante : contrôle-le sur le tirage test.

- **Recadrage** : chaque photo remplit sa case et ce qui dépasse est coupé.
  - Sur les modèles bleu nuit, les cases sont verticales ou presque carrées. Une borne en vertical coupe le moins.
  - Sur le modèle crème, la grande photo du bas est très panoramique : le haut et le bas de l'image sont coupés. Laisse de la place au-dessus des têtes.
- **Décors devant les photos** : sur le 3 photos paysage, les flûtes de champagne et le ballon transparent passent devant les photos, avec un léger effet de verre. Sur le modèle crème, c'est le ruban doré qui passe devant la 1ʳᵉ photo. C'est voulu.
- **Qualité** : les cadres ont été agrandis par IA (Real-ESRGAN) jusqu'à la taille d'impression 10×15 à 300 dpi, pour garder les dorures et le texte nets.
- **Les aperçus** utilisent les photos de l'exemple uniquement pour illustrer le rendu.

## Refaire ou modifier les modèles

Les scripts sont dans `tools/cadres_lumabooth/` (voir le README de ce dossier).
