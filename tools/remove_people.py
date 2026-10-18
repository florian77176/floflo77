"""Efface les personnes d'une photo : détourage IA (rembg) puis reconstruction du décor (LaMa).

Usage : python tools/remove_people.py entree.jpg sortie.jpg [--shadow]
  --shadow : efface aussi les ombres portées au sol sous les personnes
"""
import sys

import cv2
import numpy as np
import torch
from PIL import Image
from rembg import new_session, remove
from simple_lama_inpainting.utils import download_model, prepare_img_and_mask

LAMA_URL = 'https://github.com/enesmsahin/simple-lama-inpainting/releases/download/v0.1.0/big-lama.pt'
WORK_SIZE = 1024  # LaMa donne de meilleurs résultats autour de cette taille

src, dst = sys.argv[1], sys.argv[2]
with_shadow = '--shadow' in sys.argv

img = Image.open(src).convert('RGB')
W, H = img.size

# 1. Masque des personnes
mask = np.array(remove(img, session=new_session('u2net_human_seg'), only_mask=True))
mask = (mask > 40).astype(np.uint8) * 255
grow = max(9, W // 60)
mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)), iterations=2)

# 2. Ombres au sol : on prolonge le masque sous chaque personne
if with_shadow:
    n, _, stats, _ = cv2.connectedComponentsWithStats(mask)
    for x, y, w, h, area in stats[1:]:
        if area < W * H * 0.005:
            continue
        cv2.rectangle(mask, (x - w // 3, y + int(h * 0.8)), (x + w + w // 3, min(H, y + h + int(h * 0.15))), 255, -1)

# 3. Reconstruction du décor à résolution de travail, puis remise à l'échelle
scale = WORK_SIZE / max(W, H)
small = img.resize((round(W * scale), round(H * scale)), Image.LANCZOS)
small_mask = Image.fromarray(mask).resize(small.size, Image.NEAREST)
lama = torch.jit.load(download_model(LAMA_URL), map_location='cpu').eval()
image_t, mask_t = prepare_img_and_mask(small, small_mask, torch.device('cpu'))
with torch.inference_mode():
    res = lama(image_t, mask_t)[0].permute(1, 2, 0).numpy()
filled = Image.fromarray(np.clip(res * 255, 0, 255).astype(np.uint8)).crop((0, 0, *small.size)).resize((W, H), Image.LANCZOS)

# 4. On ne remplace que la zone masquée (bords adoucis), le reste garde la netteté d'origine
soft = cv2.GaussianBlur(mask, (0, 0), grow / 2).astype(np.float32)[..., None] / 255
out = np.array(img).astype(np.float32) * (1 - soft) + np.array(filled).astype(np.float32) * soft
Image.fromarray(out.astype(np.uint8)).save(dst, quality=95)
print('ok', dst)
