"""Prépare les extraits vidéo (rushs TikTok du client) pour le montage, d'après tools/clips_manifest.json :
découpe, vitesse (accéléré / ralenti fluide), débruitage, 1080×1920, netteté, étalonnage léger.

Usage : python tools/build_clips.py dossier_rushs [id_clip ...]
Écrit public/funny/footage/<id>.mp4
"""
import glob
import json
import os
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'public', 'funny', 'footage')
manifest = json.load(open(os.path.join(os.path.dirname(__file__), 'clips_manifest.json')))
src_dir = sys.argv[1]
only = set(sys.argv[2:])
os.makedirs(OUT, exist_ok=True)

GRADE = 'hqdn3d=1.5:1.5:6:6,scale=1080:1920:flags=lanczos,unsharp=5:5:0.55,eq=contrast=1.05:saturation=1.14:gamma=0.98'

for cid, c in manifest.items():
    if only and cid not in only:
        continue
    src = glob.glob(os.path.join(src_dir, f'*_{c["src"]}.mp4'))[0]
    speed = c.get('speed', 1)
    chain = [f'setpts=PTS/{speed}']
    if speed < 1:
        chain.append('minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1')  # ralenti fluide
    else:
        chain.append('fps=30')
    if c.get('crop'):  # recadrage x,y,w,h en fraction (zoom dans l'image)
        x, y, w, h = c['crop']
        chain.append(f'crop=iw*{w}:ih*{h}:iw*{x}:ih*{y}')
    chain.append(GRADE)
    dst = os.path.join(OUT, f'{cid}.mp4')
    subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(c['in']), '-to', str(c['out']), '-i', src, '-an', '-vf', ','.join(chain),
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709',
         '-color_trc', 'bt709', '-movflags', '+faststart', dst],
        check=True,
    )
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout)
    print(f'ok {cid}: {d:.2f}s')
