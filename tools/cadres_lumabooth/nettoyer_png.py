"""Nettoie la transparence d'un cadre PNG pour LumaBooth : seules les fenêtres photo restent 100 % transparentes.

- les pixels presque transparents (alpha < 16) deviennent transparents : plus de liseré « à moitié visible » ;
- on garde comme fenêtres photo les N plus grandes zones 100 % transparentes (N = nombre de cases du modèle) ;
- les petites zones transparentes en trop (creux d'un chiffre, intérieur d'une boucle de ruban, reflets)
  deviennent opaques : remplies avec une couleur donnée, ou reconstruites à partir des pixels voisins.

Usage : python3 nettoyer_png.py cadre.png N [couleur_hex|inpaint]   (le fichier est réécrit)
"""
import sys

import cv2
import numpy as np
from PIL import Image


def clean(rgba, n_windows, fill='inpaint'):
    rgba = rgba.copy()
    a = rgba[..., 3]
    a[a < 16] = 0
    tr = (a == 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(tr, connectivity=4)
    order = sorted(range(1, n), key=lambda i: -st[i, 4])
    keep = set(order[:n_windows])
    extra = np.isin(lab, [i for i in order[n_windows:]])
    if extra.any():
        # pixels semi-transparents qui bordent ces petites zones : opaques aussi
        grow = cv2.dilate(extra.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        main = np.isin(lab, list(keep))
        zone = (extra | (grow & (a < 255))) & ~main
        rgb = np.ascontiguousarray(rgba[..., :3])
        if fill == 'inpaint':
            rgb = cv2.inpaint(rgb, zone.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
        else:
            c = tuple(int(fill.lstrip('#')[k:k + 2], 16) for k in (0, 2, 4))
            al = (a[zone].astype(np.float32) / 255)[:, None]
            rgb[zone] = np.round(rgb[zone] * al + np.array(c, np.float32) * (1 - al)).astype(np.uint8)
        rgba[..., :3] = rgb
        a[zone] = 255
    rgba[..., 3] = a
    tr = (a == 0).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(tr, connectivity=4)
    return rgba, [tuple(int(v) for v in st2[i][:5]) for i in range(1, n2)], int(extra.sum())


if __name__ == '__main__':
    path, nw = sys.argv[1], int(sys.argv[2])
    fill = sys.argv[3] if len(sys.argv) > 3 else 'inpaint'
    im = Image.open(path)
    dpi = im.info.get('dpi', (300, 300))
    out, holes, fixed = clean(np.array(im.convert('RGBA')), nw, fill)
    Image.fromarray(out, 'RGBA').save(path, dpi=dpi, optimize=True)
    print(path, '| fenêtres 100 % transparentes :', [h[:4] for h in holes], '| pixels parasites corrigés :', fixed)
