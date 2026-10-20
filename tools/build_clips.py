"""Prépare les extraits vidéo (rushs TikTok du client) pour le montage, d'après tools/clips_manifest.json :
découpe, vitesse (accéléré / ralenti fluide), « velocity edit » (rampe de vitesse), débruitage, 1080×1920,
netteté, étalonnage léger.

Rampe : "ramp": [[fin_1, duree_1], [fin_2, duree_2], ...] : chaque segment va jusqu'à la fraction « fin » de
l'extrait source et dure « duree » secondes à l'écran (la vitesse en découle).
Ex. gonflage : [[0.08, 0.35], [0.85, 1.75], [1, 0.9]] = démarre, file en accéléré, ralentit structure gonflée.

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
    post = []
    if c.get('crop'):  # recadrage x,y,w,h en fraction (zoom dans l'image)
        x, y, w, h = c['crop']
        post.append(f'crop=iw*{w}:ih*{h}:iw*{x}:ih*{y}')
    post.append(GRADE)
    enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709',
           '-color_trc', 'bt709', '-movflags', '+faststart']
    dst = os.path.join(OUT, f'{cid}.mp4')
    if c.get('ramp'):
        # segments à vitesses différentes, recollés (filter_complex)
        span = c['out'] - c['in']
        bounds, prev = [], 0.0
        for end, secs in c['ramp']:
            bounds.append((prev * span, end * span, secs))
            prev = end
        parts, labels = [], []
        for i, (a, b, secs) in enumerate(bounds):
            sp = (b - a) / secs
            mi = ',minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1' if sp < 0.9 else ''
            parts.append(f'[0:v]trim=start={a:.3f}:end={b:.3f},setpts=(PTS-STARTPTS)/{sp:.4f},fps=30{mi}[s{i}]')
            labels.append(f'[s{i}]')
        fc = ';'.join(parts) + f';{"".join(labels)}concat=n={len(labels)}:v=1:a=0,{",".join(post)}[v]'
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(c['in']), '-to', str(c['out']), '-i', src, '-an',
                        '-filter_complex', fc, '-map', '[v]', *enc, dst], check=True)
    else:
        speed = c.get('speed', 1)
        chain = [f'setpts=PTS/{speed}']
        if speed < 1:
            chain.append('minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1')  # ralenti fluide
        else:
            chain.append('fps=30')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(c['in']), '-to', str(c['out']), '-i', src, '-an',
                        '-vf', ','.join(chain + post), *enc, dst], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout)
    print(f'ok {cid}: {d:.2f}s')

# durées réelles des extraits, lues par le montage (src/funny/footage-durations.json)
dur_path = os.path.join(ROOT, 'src', 'funny', 'footage-durations.json')
durations = json.load(open(dur_path)) if os.path.exists(dur_path) else {}
for f in sorted(os.listdir(OUT)):
    if f.endswith('.mp4') and f[:-4] in manifest:
        durations[f[:-4]] = round(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                                         os.path.join(OUT, f)], capture_output=True, text=True).stdout), 3)
durations = {k: v for k, v in durations.items() if k in manifest}
json.dump(dict(sorted(durations.items())), open(dur_path, 'w'), indent=2)
