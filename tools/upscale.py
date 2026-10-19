"""Agrandit une photo trop petite avec Real-ESRGAN (x4) pour qu'elle reste nette en plein écran.

Usage : python tools/upscale.py modele.pth entree.jpg sortie.jpg [hauteur_finale]
"""
import sys

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

model_path, src, dst = sys.argv[1:4]
target_h = int(sys.argv[4]) if len(sys.argv) > 4 else 2400

model = ModelLoader(device='cpu').load_from_file(model_path).eval()
img = Image.open(src).convert('RGB')
x = torch.from_numpy(np.array(img)).float().div(255).permute(2, 0, 1)[None]
tile = 256  # par tuiles pour limiter la mémoire
_, _, H, W = x.shape
out = torch.zeros(1, 3, H * 4, W * 4)
with torch.inference_mode():
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            pad = 16
            ya, xa = max(0, y0 - pad), max(0, x0 - pad)
            yb, xb = min(H, y0 + tile + pad), min(W, x0 + tile + pad)
            r = model(x[:, :, ya:yb, xa:xb])
            oy, ox = (y0 - ya) * 4, (x0 - xa) * 4
            th, tw = min(tile, H - y0) * 4, min(tile, W - x0) * 4
            out[:, :, y0 * 4 : y0 * 4 + th, x0 * 4 : x0 * 4 + tw] = r[:, :, oy : oy + th, ox : ox + tw]
res = Image.fromarray((out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))
res = res.resize((round(res.width * target_h / res.height), target_h), Image.LANCZOS)
res.save(dst, quality=93)
print('ok', dst, res.size)
