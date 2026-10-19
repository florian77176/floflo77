"""Calcule la carte de profondeur d'une photo (Depth Anything V2) pour l'effet « photo 3D ».

Usage : python tools/depth.py dossier_sortie photo1.jpg [photo2.jpg ...]
Écrit <nom>-depth.png (blanc = proche, noir = loin), même taille que la photo.
"""
import os
import sys

import numpy as np
import torch
from PIL import Image
from transformers import pipeline

out_dir = sys.argv[1]
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')
for src in sys.argv[2:]:
    img = Image.open(src).convert('RGB')
    with torch.inference_mode():
        pred = pipe(img)['predicted_depth']
    d = torch.nn.functional.interpolate(pred[None, None] if pred.dim() == 2 else pred[None], size=img.size[::-1], mode='bicubic')[0, 0].numpy()
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    name = os.path.splitext(os.path.basename(src))[0]
    Image.fromarray((d * 255).astype(np.uint8)).save(os.path.join(out_dir, f'{name}-depth.png'))
    print('ok', name)
