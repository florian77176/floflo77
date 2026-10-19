"""Effet « photo 3D » (comme le zoom 3D de CapCut) : la caméra avance dans la photo, le premier plan
grossit plus vite que le fond grâce à la carte de profondeur. Produit un clip MP4 1080×1920.

Usage : python tools/parallax.py photo.jpg depth.png sortie.mp4 [focus_x] [focus_y] [orbite]
  focus_x / focus_y : point visé (0..1 dans la photo), orbite : glissement latéral (-1..1)
"""
import subprocess
import sys

import cv2
import numpy as np

W, H, FRAMES, FPS = 1080, 1920, 96, 30

photo, depth_path, out = sys.argv[1:4]
fx = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
fy = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
orbit = float(sys.argv[6]) if len(sys.argv) > 6 else 0.4

img = cv2.imread(photo, cv2.IMREAD_COLOR).astype(np.float32)
dep = cv2.imread(depth_path, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
ih, iw = img.shape[:2]
# profondeur adoucie et « gonflée » : les bords du premier plan débordent un peu sur le fond (moins d'artefacts)
dep = cv2.dilate(dep, np.ones((9, 9), np.uint8))
dep = cv2.GaussianBlur(dep, (0, 0), 6)

# cadrage 9:16 dans la photo (centré sur le point visé), en pixels source
scale0 = max(W / iw, H / ih) * 1.04
cw, ch = W / scale0, H / scale0
cx0 = np.clip(fx * iw, cw / 2, iw - cw / 2)
cy0 = np.clip(fy * ih, ch / 2, ih - ch / 2)

gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
base_x = (cx0 + (gx - W / 2) / scale0).astype(np.float32)  # coordonnées source sans mouvement
base_y = (cy0 + (gy - H / 2) / scale0).astype(np.float32)

ZOOM_FAR, ZOOM_NEAR = 0.07, 0.22  # zoom final du fond / du premier plan
SHIFT = 0.025 * cw * orbit  # glissement latéral max (en px source)

proc = subprocess.Popen(
    ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
     '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709',
     '-color_trc', 'bt709', '-movflags', '+faststart', out],
    stdin=subprocess.PIPE,
)
for f in range(FRAMES):
    t = f / (FRAMES - 1)
    e = 1 - (1 - t) ** 2.2  # démarre vite, ralentit (comme un travelling)
    # point fixe : on itère pour trouver, pour chaque pixel de sortie, la profondeur du point source
    sx, sy = base_x, base_y
    for _ in range(3):
        d = cv2.remap(dep, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        s = 1 + e * (ZOOM_FAR + (ZOOM_NEAR - ZOOM_FAR) * d)
        shift = e * SHIFT * (d - 0.5)
        sx = (cx0 + (base_x - cx0) / s - shift).astype(np.float32)
        sy = (cy0 + (base_y - cy0) / s).astype(np.float32)
    frame = cv2.remap(img, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    proc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes())
proc.stdin.close()
proc.wait()
print('ok', out)
