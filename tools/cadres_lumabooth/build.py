"""Construit les modèles LumaBooth (format dslrBooth : template.xml + PNG) pour les 30 ans de Jordan.

Pour chaque cadre :
  1. image de base à la taille d'impression 10x15 à 300 dpi (1200x1800 ou 1800x1200) ;
  2. les cases photo (blanches) deviennent transparentes, bords lissés, décors posés dessus conservés ;
  3. une case photo LumaBooth par fenêtre (position, taille, rotation), avec un débord caché sous la bordure dorée ;
  4. template.xml + PNG zippés (importables dans LumaBooth) + aperçu avec des photos d'exemple.
"""
import json
import math
import os
import sys
import zipfile

import cv2
import numpy as np
from PIL import Image

S = os.getcwd()  # dossier de travail : src/, base/, out/
OUT = os.path.join(S, 'out')
os.makedirs(OUT, exist_ok=True)

MAX_BLEED = 14   # px de débord maxi sous la bordure dorée (à 300 dpi, ~1,2 mm)
MIN_BLEED = 3


BASE_DIR = os.environ.get('BASE_DIR', 'base')


def base_image(name, size):
    """Image de base à la taille finale (agrandie par l'IA puis réduite en Lanczos)."""
    p = os.path.join(S, BASE_DIR, f'{name}.png')
    im = Image.open(p).convert('RGB')
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return np.array(im)


def white_windows(rgb, min_frac=0.02):
    """Fenêtres photo = grandes zones presque blanches et peu saturées."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    mask = ((hsv[..., 1] < 28) & (hsv[..., 2] > 195)).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask)
    h, w = mask.shape
    blobs = [(lab == i) for i in range(1, n) if stats[i, 4] > min_frac * h * w]
    # ordre de lecture : par rangées (fenêtres qui se recouvrent verticalement), puis de gauche à droite
    info = []
    for b in blobs:
        ys, xs = np.nonzero(b)
        info.append((ys.min(), ys.max(), xs.mean(), b))
    info.sort(key=lambda t: t[0])
    rows = []
    for t in info:
        if rows:
            r0, r1 = rows[-1][0], rows[-1][1]
            ov = min(r1, t[1]) - max(r0, t[0])
            if ov > 0.5 * min(r1 - r0, t[1] - t[0]):
                rows[-1][2].append(t)
                rows[-1][0], rows[-1][1] = min(r0, t[0]), max(r1, t[1])
                continue
        rows.append([t[0], t[1], [t]])
    return [t[3] for r in rows for t in sorted(r[2], key=lambda t: t[2])]


def key_out_white(rgb, blobs, grow=4):
    """Alpha : transparent dans les fenêtres, transitions lissées (« color to alpha » sur le blanc du papier)."""
    h, w, _ = rgb.shape
    alpha = np.ones((h, w), np.float32)
    out = rgb.astype(np.float32).copy()
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1))
    for b in blobs:
        region = cv2.dilate(b.astype(np.uint8), k).astype(bool)
        Wc = np.median(rgb[b].astype(np.float32), axis=0)            # blanc du papier
        noise = rgb[b].astype(np.float32).std(axis=0).max()
        C = rgb[region].astype(np.float32)
        darker = np.clip((Wc - C) / Wc, 0, 1).max(axis=1)           # écart vers le sombre
        t0 = min(0.12, max(0.04, 3.5 * noise / 255))               # zone morte (texture du papier)
        t1 = 0.38                                                  # au-delà : opaque (doré, décors)
        a = np.clip((darker - t0) / (t1 - t0), 0, 1)
        F = (C - (1 - a)[:, None] * Wc) / np.maximum(a, 1e-3)[:, None]
        F = np.clip(F, 0, 255)
        out[region] = np.where(a[:, None] > 0, F, C)
        alpha[region] = a
    return out.astype(np.uint8), alpha, (t0, noise)


def rect_from_points(pts):
    """Rectangle tourné minimal ; renvoie centre, largeur, hauteur, angle en degrés dans (-45, 45]
    (sens horaire positif, repère image y vers le bas)."""
    (cx, cy), (rw, rh), _ = cv2.minAreaRect(pts.astype(np.float32))
    box = cv2.boxPoints(((cx, cy), (rw, rh), _))
    # arête la plus horizontale = « largeur »
    best = None
    for i in range(4):
        p, q = box[i], box[(i + 1) % 4]
        ang = math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
        a = ((ang + 90) % 180) - 90  # dans [-90, 90)
        if best is None or abs(a) < abs(best[0]):
            best = (a, np.hypot(*(q - p)), np.hypot(*(box[(i + 2) % 4] - q)))
    ang, ww, hh = best
    return cx, cy, ww, hh, ang


def rect_mask(shape, cx, cy, w, h, ang):
    m = np.zeros(shape, np.uint8)
    box = cv2.boxPoints(((cx, cy), (w, h), ang))
    cv2.fillPoly(m, [np.round(box).astype(np.int32)], 1)
    return m.astype(bool)


def rect_side_mask(shape, cx, cy, w, h, ang, b):
    """Rectangle agrandi de b = (gauche, haut, droite, bas) dans son propre repère."""
    l, t, r, bo = b
    th = math.radians(ang)
    ux, uy = math.cos(th), math.sin(th)      # axe largeur
    vx, vy = -math.sin(th), math.cos(th)     # axe hauteur
    dx = (r - l) / 2
    dy = (bo - t) / 2
    ncx = cx + dx * ux + dy * vx
    ncy = cy + dx * uy + dy * vy
    return (ncx, ncy, w + l + r, h + t + bo, ang)


def placeholders(alpha, blobs, order=None, extra_forbidden=None):
    """Une case photo par fenêtre, débord maxi par côté sans déborder dans une fenêtre placée DESSOUS
    (une case du dessous peut passer sous une fenêtre du dessus : la photo du dessus la cache)."""
    order = order or list(range(len(blobs)))
    h, w = alpha.shape
    transparent = []
    for b in blobs:
        reg = cv2.dilate(b.astype(np.uint8), np.ones((11, 11), np.uint8)).astype(bool)
        transparent.append(reg & (alpha < 0.995))
    rects = []
    for i, T in enumerate(transparent):
        ys, xs = np.nonzero(T)
        P = np.stack([xs, ys], 1).astype(np.float64)
        cx0, cy0, rw0, rh0, ang0 = rect_from_points(P)
        others = np.zeros_like(T)
        for j, Tj in enumerate(transparent):
            if j != i and order.index(j) < order.index(i):
                others |= Tj
        if extra_forbidden is not None:
            others |= extra_forbidden
        others[0, :] = others[-1, :] = True
        others[:, 0] = others[:, -1] = True
        # angle : on cherche le rectangle qui couvre la fenêtre sans toucher les fenêtres du dessous
        best = None
        for ang in np.arange(ang0 - 3, ang0 + 3.001, 0.1):
            th = math.radians(ang)
            u = np.array([math.cos(th), math.sin(th)])
            v = np.array([-math.sin(th), math.cos(th)])
            pu, pv = P @ u, P @ v
            u0, u1, v0, v1 = pu.min() - 0.5, pu.max() + 0.5, pv.min() - 0.5, pv.max() + 0.5
            c = ((u0 + u1) / 2) * u + ((v0 + v1) / 2) * v
            cand = (c[0], c[1], u1 - u0, v1 - v0, float(ang))
            ov = int((rect_mask((h, w), *cand) & others).sum())
            score = (ov, cand[2] * cand[3])
            if best is None or score < best[0]:
                best = (score, cand)
        cx, cy, rw, rh, ang = best[1]
        bleed = [MAX_BLEED] * 4
        for side in range(4):
            for bv in range(MAX_BLEED, -1, -1):
                bb = [0, 0, 0, 0]
                bb[side] = bv
                r = rect_side_mask((h, w), cx, cy, rw, rh, ang, bb)
                m = rect_mask((h, w), *r)
                if not (m & others).any():
                    bleed[side] = bv
                    break
            else:
                bleed[side] = 0
        while True:
            r = rect_side_mask((h, w), cx, cy, rw, rh, ang, bleed)
            d = dict(cx=r[0], cy=r[1], w=r[2], h=r[3], ang=r[4])
            # vérif sur le rectangle arrondi tel qu'écrit dans le XML
            L, Tp, Wd, Hd, A = to_xml_rect(d, w, h)
            cover = rect_mask((h, w), L + Wd / 2, Tp + Hd / 2, Wd, Hd, A)
            ov = int((cover & others).sum())
            if ov == 0 or max(bleed) == 0:
                break
            bleed = [max(0, b - 1) for b in bleed]
        missed = int((T & ~cover).sum())
        rects.append(dict(cx=r[0], cy=r[1], w=r[2], h=r[3], ang=r[4], bleed=bleed, missed=missed,
                          overlap=ov, win=(cx, cy, rw, rh, ang)))
    return rects


def to_xml_rect(r, W, H):
    w = int(math.ceil(r['w']))
    h = int(math.ceil(r['h']))
    left = int(round(r['cx'] - w / 2))
    top = int(round(r['cy'] - h / 2))
    return left, top, w, h, round(r['ang'], 1)


def write_template(name, title, rgba, rects, W, H, bg='#FF14213D', order=None):
    order = order or list(range(len(rects)))
    folder = os.path.join(OUT, name)
    os.makedirs(folder, exist_ok=True)
    png_name = f'{name}.png'
    Image.fromarray(rgba, 'RGBA').save(os.path.join(folder, png_name), dpi=(300, 300), optimize=True)
    els = []
    n = len(rects)
    for i, r in enumerate(rects):
        left, top, w, h, ang = to_xml_rect(r, W, H)
        els.append(
            f'    <Photo Name="Photo {i + 1}" Opacity="100" ShadowEnabled="False" ShadowColor="#FF000000" '
            f'ShadowDepth="10" ShadowRadius="20" ShadowDirection="-45" Width="{w}" Height="{h}" Top="{top}" '
            f'Left="{left}" ImagePath="" KeepAspect="False" Thickness="0" StrokeColor="#FF000000" '
            f'PhotoNumber="{i + 1}" Rotation="{ang:g}" ZIndex="{order.index(i)}" IsLocked="True" />')
    els.insert(0,
        f'    <Image Name="Cadre {title}" Opacity="100" ShadowEnabled="False" ShadowColor="#FF000000" '
        f'ShadowDepth="10" ShadowRadius="20" ShadowDirection="-45" Width="{W}" Height="{H}" Top="0" Left="0" '
        f'ImagePath="{png_name}" KeepAspect="True" Thickness="0" StrokeColor="#FF000000" ZIndex="{n}" '
        f'IsLocked="True" />')
    xml = ('﻿<?xml version="1.0" encoding="UTF-8"?>\n'
           f'<Template Name="{title}" IsFavorite="False" Width="{W}" Height="{H}" Dimensions="0" '
           f'Resolution="300" BackgroundColor="{bg}" print_2_per_page="False" PrintToSecondaryPrinter="False" '
           f'LastSavedDate="11/10/2026 12:00:00">\n  <Elements>\n' + '\n'.join(els) + '\n  </Elements>\n</Template>\n')
    with open(os.path.join(folder, 'template.xml'), 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(xml)
    zpath = os.path.join(OUT, f'{name}.zip')
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(folder, 'template.xml'), 'template.xml')
        z.write(os.path.join(folder, png_name), png_name)
    return zpath


def fill_crop(photo, w, h):
    """Remplit w x h en recadrant au centre (comme une case photo)."""
    pw, ph = photo.size
    s = max(w / pw, h / ph)
    p = photo.resize((max(1, round(pw * s)), max(1, round(ph * s))), Image.LANCZOS)
    x0 = (p.width - w) // 2
    y0 = (p.height - h) // 2
    return p.crop((x0, y0, x0 + w, y0 + h))


def render_preview(rgba, rects, photos, bg=(20, 33, 61), with_boxes=False, order=None):
    order = order or list(range(len(rects)))
    """Reproduit le rendu : photos (remplies, tournées autour du centre) sous le cadre PNG."""
    H, W = rgba.shape[:2]
    canvas = Image.new('RGBA', (W, H), bg + (255,))
    for i in order:
        r = rects[i]
        left, top, w, h, ang = to_xml_rect(r, W, H)
        ph = fill_crop(photos[i % len(photos)], w, h).convert('RGBA')
        if with_boxes:
            ph = Image.new('RGBA', (w, h), [(230, 40, 90, 255), (20, 200, 220, 255), (120, 220, 40, 255)][i % 3])
        rot = ph.rotate(-ang, resample=Image.BICUBIC, expand=True)  # PIL : sens anti-horaire
        cx, cy = left + w / 2, top + h / 2
        canvas.alpha_composite(rot, (int(round(cx - rot.width / 2)), int(round(cy - rot.height / 2))))
    canvas.alpha_composite(Image.fromarray(rgba, 'RGBA'))
    return canvas.convert('RGB')
