"""Agrandit une vidéo basse résolution (ex. 576×1024 de TikTok) en 1080×1920 nette, image par image,
avec Real-ESRGAN « compact » (realesr-general-x4v3, rapide), puis la réencode.

Usage : python tools/upscale_video.py modele.pth entree.mp4 sortie.mp4 [debut_s] [duree_s] [vitesse]
  vitesse : 2 = deux fois plus rapide (accéléré), 0.5 = ralenti
"""
import subprocess
import sys

import numpy as np
import torch
from spandrel import ModelLoader

model_path, src, dst = sys.argv[1:4]
start = float(sys.argv[4]) if len(sys.argv) > 4 else 0
dur = float(sys.argv[5]) if len(sys.argv) > 5 else None
speed = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
W, H, FPS = 1080, 1920, 30

torch.set_num_threads(4)
model = ModelLoader(device='cpu').load_from_file(model_path).eval()

# décodage : extrait, vitesse, 30 i/s, recadrage 9:16 à la taille source
vf = f'setpts=PTS/{speed},fps={FPS},crop=trunc(ih*9/16/2)*2:ih,scale=576:1024:flags=lanczos'
cmd_in = ['ffmpeg', '-loglevel', 'error', '-ss', str(start)]
if dur:
    cmd_in += ['-t', str(dur * speed)]
cmd_in += ['-i', src, '-an', '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
dec = subprocess.Popen(cmd_in, stdout=subprocess.PIPE)
enc = subprocess.Popen(
    ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
     '-vf', 'unsharp=5:5:0.4', '-c:v', 'libx264', '-preset', 'slow', '-crf', '13', '-pix_fmt', 'yuv420p',
     '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', dst],
    stdin=subprocess.PIPE,
)
fw, fh = 576, 1024
n = 0
with torch.inference_mode():
    while True:
        buf = dec.stdout.read(fw * fh * 3)
        if len(buf) < fw * fh * 3:
            break
        x = torch.from_numpy(np.frombuffer(buf, np.uint8).reshape(fh, fw, 3).copy()).float().div(255).permute(2, 0, 1)[None]
        y = model(x)  # x4 → 2304×4096
        y = torch.nn.functional.interpolate(y, size=(H, W), mode='area')
        enc.stdin.write((y[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8).tobytes())
        n += 1
enc.stdin.close()
enc.wait()
print('ok', dst, n, 'images')
