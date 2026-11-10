"""Guides de placement (cases numérotées) + tableau des réglages pour la notice."""
import json, math, sys, os
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
COLS = [(230, 40, 90), (20, 170, 200), (110, 190, 30)]
rows = {}
for name in ['1photo', '2photos', '3photos', '3photos_creme']:
    folder = f'out/Jordan30_{name}'
    root = ET.parse(f'{folder}/template.xml').getroot()
    W, H = int(root.get('Width')), int(root.get('Height'))
    els = root.find('Elements')
    over = Image.open(f'{folder}/Jordan30_{name}.png').convert('RGBA')
    photos = sorted([e for e in els if e.tag == 'Photo'], key=lambda e: int(e.get('ZIndex')))
    canvas = Image.new('RGBA', (W, H), (40, 40, 40, 255))
    info = []
    for e in photos:
        n = int(e.get('PhotoNumber'))
        L, T, w, h, r = (float(e.get(k)) for k in ('Left', 'Top', 'Width', 'Height', 'Rotation'))
        box = Image.new('RGBA', (int(w), int(h)), COLS[(n - 1) % 3] + (255,))
        rot = box.rotate(-r, resample=Image.BICUBIC, expand=True)
        cx, cy = L + w / 2, T + h / 2
        canvas.alpha_composite(rot, (int(round(cx - rot.width / 2)), int(round(cy - rot.height / 2))))
        info.append(dict(n=n, L=int(L), T=int(T), w=int(w), h=int(h), r=r, cx=cx, cy=cy,
                         z=int(e.get('ZIndex'))))
    canvas.alpha_composite(over)
    d = ImageDraw.Draw(canvas)
    f1 = ImageFont.truetype(FONT, int(min(W, H) * 0.11))
    f2 = ImageFont.truetype(FONT, int(min(W, H) * 0.028))
    for i in info:
        txt = f"{i['n']}"
        d.text((i['cx'], i['cy'] - min(W, H) * 0.03), txt, font=f1, fill='white', anchor='mm', stroke_width=6, stroke_fill='black')
        sub = f"{i['w']} x {i['h']} px  |  {i['r']:+g}°"
        d.text((i['cx'], i['cy'] + min(W, H) * 0.06), sub, font=f2, fill='white', anchor='mm', stroke_width=4, stroke_fill='black')
    canvas.convert('RGB').save(f'out/guide_{name}.jpg', quality=90)
    rows[name] = dict(W=W, H=H, photos=sorted(info, key=lambda i: i['n']))
json.dump(rows, open('out/reglages.json', 'w'), indent=1)
for k, v in rows.items():
    print(k, v['W'], v['H'])
    for i in v['photos']:
        print('  photo', i['n'], 'L', i['L'], 'T', i['T'], 'W', i['w'], 'H', i['h'], 'rot', i['r'], 'z', i['z'],
              '| %', round(100 * i['L'] / v['W'], 1), round(100 * i['T'] / v['H'], 1), round(100 * i['w'] / v['W'], 1), round(100 * i['h'] / v['H'], 1))
