"""Donne la profondeur (0 = loin, 1 = proche) de points de l'écran sur la 1re image d'un clip 3D,
pour que les annotations suivent le mouvement de caméra (même calcul que tools/parallax.py).

Usage : python tools/anchor_depth.py photo.jpg depth.png focus_x focus_y x1,y1 [x2,y2 ...]
  (x, y en fraction de l'écran 1080×1920)
"""
import sys

import cv2
import numpy as np

W, H = 1080, 1920
photo, depth_path, fx, fy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
ih, iw = cv2.imread(photo).shape[:2]
dep = cv2.imread(depth_path, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
dep = cv2.GaussianBlur(cv2.dilate(dep, np.ones((9, 9), np.uint8)), (0, 0), 6)
scale0 = max(W / iw, H / ih) * 1.04
cw, ch = W / scale0, H / scale0
cx0 = np.clip(fx * iw, cw / 2, iw - cw / 2)
cy0 = np.clip(fy * ih, ch / 2, ih - ch / 2)
for pt in sys.argv[5:]:
    x, y = map(float, pt.split(','))
    sx = int(np.clip(cx0 + (x * W - W / 2) / scale0, 0, iw - 1))
    sy = int(np.clip(cy0 + (y * H - H / 2) / scale0, 0, ih - 1))
    print(pt, round(float(dep[sy, sx]), 2))
