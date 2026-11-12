# Cadres photobooth → modèles LumaBooth

Ces scripts transforment des cadres (PNG/JPG avec des cases photo blanches) en modèles LumaBooth importables. Le format est celui de dslrBooth / LumaBooth pour Windows : un .zip qui contient `template.xml` et le PNG du cadre. Ils ont servi pour les 30 ans de Jordan (`cadres/jordan-30ans/`).

**Méthode actuelle : `fidele.py`.** Ce script garde les cadres d'origine (place, taille, inclinaison) mais les remplace par de vrais rectangles aux valeurs rondes. L'ombre d'origine est conservée, les décors posés devant sont recollés par-dessus, et les cadres trop près du bord sont déplacés en étirant doucement le fond. Les réglages sont dans `SPECS`.

**Variante `regulier.py`.** Les fenêtres dessinées par l'IA sont irrégulières. Ce script les remplace par de vrais rectangles identiques (taille et angle ronds, format 2:3 / 3:2 d'un reflex), en procédant ainsi :

- il retire les anciens cadres du fond (inpainting) ;
- il redessine la dorure avec la texture d'origine (coins en onglet) et ajoute une ombre portée ;
- il écrit des cases photo LumaBooth exactes (fenêtre + 10 px de débord).

Les cases de chaque modèle sont définies dans `SPECS`. Lancer `python3 regulier.py [noms…]` depuis le dossier de travail.

Méthode précédente (cadres d'origine découpés tels quels) :

1. `x4.py modele.pth src/a.jpg base/a.png …` : agrandissement ×4 par Real-ESRGAN (`RealESRGAN_x4plus.pth`, à prendre dans les releases GitHub de xinntao/Real-ESRGAN). La réduction Lanczos à 1200×1800 ou 1800×1200 se fait ensuite toute seule dans `base_image()`.
2. `run_white.py <nom>…` (cadres à cases blanches) :
   - repère les cases (zones blanches) ;
   - cale chaque côté sur la dorure (droite RANSAC, donc les décors posés devant sont ignorés) ;
   - rend la case transparente en gardant opaques les décors posés devant (doré ou foncé) ;
   - gère les cadres qui se chevauchent (ordre de superposition) ;
   - calcule les cases photo (rectangle tourné, débord de 14 px maximum sous la bordure, sans jamais déborder dans une autre fenêtre).

   Les retouches à la main propres à un cadre (champagne, ballon transparent) se trouvent dans `retouches()`.
3. `run_exemple.py build` (cadre dont les cases contiennent déjà des photos) : les cases sont repérées par leur bordure dorée. Les décors à garder devant (ruban) se trouvent dans `decor_keep()`.
4. `guides.py` : guides numérotés et tableau des réglages.

Tous les scripts se lancent depuis un dossier de travail qui contient `src/` (originaux), `base/` (agrandis) et `out/` (résultats) :

```bash
cd dossier_de_travail
```

```bash
python3 chemin/vers/tools/cadres_lumabooth/run_white.py 1photo 2photos 3photos
```

Dépendances : `torch` (CPU), `spandrel`, `opencv-python-headless`, `numpy`, `Pillow`.

Hypothèse sur le format : `Rotation` est en degrés, dans le sens horaire, autour du centre du rectangle (Left/Top/Width/Height avant rotation). Le `ZIndex` le plus grand est au-dessus.
