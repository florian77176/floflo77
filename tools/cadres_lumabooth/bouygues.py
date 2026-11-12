"""Bouygues Bâtiment — Cérémonie des médaillés 2026 (soirée du 2 décembre 2026).

1. Modèle d'impression LumaBooth 10x15 (1800x1200, 300 dpi) refait à partir du modèle fourni (1772x1181, JPEG) :
   fond beige uni (plus d'artefacts JPEG ni de liseré clair à droite), éléments détourés et nets (agrandis par
   l'IA puis réduits), fenêtre photo transparente exacte, logo « Remise des médailles » gardé PAR-DESSUS la photo,
   décalé de 30 px vers la gauche pour rester à plus de 4 mm du bord (coupe de l'imprimante).
2. Pages d'accueil 1920x1080 (écran PC horizontal) : fixe (PNG) et animée (MP4 en boucle de 24 s).

Usage (dossier de travail contenant bouygues/src/template.jpg, bouygues/x4/template.png, fonts/) :
    python3 bouygues.py [modele] [accueil] [anime]
"""
import math
import os
import subprocess
import sys
import zipfile

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WD = os.getcwd()
BB = os.path.join(WD, 'bouygues')
FONTS = os.path.join(WD, 'fonts')
BEIGE = np.array([235, 227, 216], np.float32)
WHITE = np.array([255, 255, 255], np.float32)
BROWN = (77, 51, 24)
ORANGE = (232, 75, 4)
K = 4                                   # facteur de l'image agrandie par l'IA
WIN1 = (115.25, 190.3, 1656.0, 948.4)   # fenêtre blanche du modèle d'origine (coordonnées 1772x1181)
LOGO_SHIFT = -30                        # px (1x) : logo « Remise des médailles » éloigné du bord droit

# groupes d'éléments (boîtes en coordonnées 1x du modèle d'origine)
GROUPS = {
    'batir': (165, 64, 415, 104),
    'logo': (1330, 92, 1760, 560),
    'bouygues': (180, 990, 398, 1142),
    'filet': (1000, 996, 1020, 1153),
    'titre': (1028, 1018, 1648, 1072),
    'medaille': (1645, 998, 1700, 1076),
    'sous_titre': (1024, 1078, 1712, 1122),
}


# ---------------------------------------------------------------- extraction des éléments (en 4x)
def extract_layer():
    """Calque RGBA (4x) des éléments posés sur le fond beige ou sur la fenêtre blanche, couleur décontaminée."""
    hi = np.array(Image.open(os.path.join(BB, 'x4', 'template.png')).convert('RGB')).astype(np.float32)
    H, W, _ = hi.shape
    x0, y0, x1, y1 = [v * K for v in WIN1]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    inside = ((xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1))
    nominal = np.where(inside[..., None], WHITE, BEIGE)
    d0 = np.sqrt(((hi - nominal) ** 2).sum(-1))
    # fond estimé localement (l'agrandissement IA décale légèrement le beige et le blanc près des éléments)
    def normconv(mask):
        m = mask.astype(np.float32)
        num = cv2.GaussianBlur(hi * m[..., None], (0, 0), 40)
        den = cv2.GaussianBlur(m, (0, 0), 40)[..., None]
        return num / np.maximum(den, 1e-3)
    bg_in = normconv((d0 < 20) & inside)
    bg_out = normconv((d0 < 20) & ~inside)
    bg = np.where(inside[..., None], bg_in, bg_out)
    d = np.sqrt(((hi - bg) ** 2).sum(-1))
    # bande autour du bord de la fenêtre : distance au segment beige -> blanc (les mélanges ne sont pas des éléments)
    band = ((np.abs(xx - x0) < 10) | (np.abs(xx - x1) < 10)) & (yy > y0 - 10) & (yy < y1 + 10) | \
           ((np.abs(yy - y0) < 10) | (np.abs(yy - y1) < 10)) & (xx > x0 - 10) & (xx < x1 + 10)
    seg = WHITE - BEIGE
    t = np.clip(((hi - BEIGE) @ seg) / (seg @ seg), 0, 1)
    dseg = np.sqrt(((hi - (BEIGE + t[..., None] * seg)) ** 2).sum(-1))
    d = np.where(band, np.maximum(dseg - 4, 0), d)
    dmax = cv2.dilate(d, np.ones((9, 9), np.uint8))
    a = np.maximum(np.clip(d / np.maximum(dmax, 30.0), 0, 1), np.clip((d - 10) / 30.0, 0, 1))
    a = a * np.clip((d - 6) / 6.0, 0, 1)                 # en dessous de 6 : bruit du fond, ignoré
    bgc = np.where(band[..., None], BEIGE + t[..., None] * seg, bg)
    F = np.clip(bgc + (hi - bgc) / np.maximum(a, 1e-3)[..., None], 0, 255)
    F[a < 1e-3] = 0
    a[:, -K * 2:] = 0                                   # liseré clair d'export sur le bord droit
    return F, a


def group_masks(shape):
    H, W = shape
    out = {}
    for k, (x0, y0, x1, y1) in GROUPS.items():
        m = np.zeros((H, W), bool)
        m[int(y0 * K):int(y1 * K), int(x0 * K):int(x1 * K)] = True
        out[k] = m
    return out


def crop_group(F, a, key, pad=6):
    x0, y0, x1, y1 = GROUPS[key]
    X0, Y0, X1, Y1 = int(x0 * K), int(y0 * K), int(x1 * K), int(y1 * K)
    aa = a[Y0:Y1, X0:X1]
    ys, xs = np.nonzero(aa > 0.02)
    cy0, cy1, cx0, cx1 = max(0, ys.min() - pad), ys.max() + pad + 1, max(0, xs.min() - pad), xs.max() + pad + 1
    return F[Y0:Y1, X0:X1][cy0:cy1, cx0:cx1].copy(), aa[cy0:cy1, cx0:cx1].copy(), (X0 + cx0, Y0 + cy0)


# ---------------------------------------------------------------- 1. modèle d'impression
def build_print(F, a, variant='fidele'):
    """variant 'fidele' : mise en page d'origine (logo par-dessus la photo, décalé de 30 px du bord).
    variant 'photo32' : fenêtre au format 3:2 du reflex (aucun recadrage), logo dans sa colonne, sur le beige.
    variant 'deux_photos' : même structure que 'photo32', deux fenêtres côte à côte (séparées par GAP px)."""
    H4, W4 = a.shape
    OW, OH = 1800, 1200
    sx, sy = OW / W4, OH / H4
    gm = group_masks((H4, W4))
    logo = gm['logo'] & (a > 0)
    wins = None
    if variant == 'fidele':
        wx0, wy0 = int(round(WIN1[0] * K * sx)), int(round(WIN1[1] * K * sy))
        wx1, wy1 = int(round(WIN1[2] * K * sx)), int(round(WIN1[3] * K * sy))
        dx, dy = LOGO_SHIFT * K, 0
    else:
        wx0, wy0 = int(round(WIN1[0] * K * sx)), int(round(WIN1[1] * K * sy))
        wy1 = int(round(WIN1[3] * K * sy))
        wx1 = wx0 + int(round((wy1 - wy0) * 1.5))
        if variant == 'deux_photos':
            GAP = 24
            wm = (wx1 - wx0 - GAP) // 2
            wins = [(wx0, wy0, wm, wy1 - wy0), (wx1 - wm, wy0, wm, wy1 - wy0)]
        ys, xs = np.nonzero(logo & (a > 0.3))
        cx4, cy4 = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        tx, ty = (wx1 + OW) / 2 - 8, (wy0 + wy1) / 2           # centre de la colonne de droite (4,5 mm du bord)
        dx, dy = tx / sx - cx4, ty / sy - cy4
    F2, a2 = F.copy(), a.copy()
    lf, la = F * logo[..., None], a * logo
    F2[logo], a2[logo] = 0, 0
    Ms = np.float32([[1, 0, dx], [0, 1, dy]])
    lf = cv2.warpAffine(lf, Ms, (W4, H4))
    la = cv2.warpAffine(la, Ms, (W4, H4))
    P = F2 * a2[..., None]
    P = lf * la[..., None] + P * (1 - la[..., None])
    A = la + a2 * (1 - la)
    # réduction 4x -> 1800x1200 en prémultiplié (bords nets, sans halo)
    Ps = cv2.resize(P, (OW, OH), interpolation=cv2.INTER_AREA)
    As = cv2.resize(A, (OW, OH), interpolation=cv2.INTER_AREA)
    # fenêtre exacte (pixels entiers) et fond beige uni
    bgA = np.ones((OH, OW), np.float32)
    wins = wins or [(wx0, wy0, wx1 - wx0, wy1 - wy0)]
    for (x, y, w, h) in wins:
        bgA[y:y + h, x:x + w] = 0
    Pf = Ps + (BEIGE * bgA[..., None]) * (1 - As[..., None])
    Af = As + bgA * (1 - As)
    C = Pf / np.maximum(Af, 1e-4)[..., None]
    # accentuation de sortie légère (zones opaques)
    sharp = np.clip(C + 0.5 * (C - cv2.GaussianBlur(C, (0, 0), 0.8)), 0, 255)
    C = np.where((Af > 0.999)[..., None], sharp, C)
    rgba = np.dstack([np.clip(np.round(C), 0, 255), np.clip(np.round(Af * 255), 0, 255)]).astype(np.uint8)
    return rgba, wins


def write_lumabooth(rgba, wins, out_dir, name='Bouygues_Medailles_2026', bleed=10):
    os.makedirs(out_dir, exist_ok=True)
    png = f'{name}.png'
    Image.fromarray(rgba, 'RGBA').save(os.path.join(out_dir, png), dpi=(300, 300), optimize=True)
    photos = ''
    for i, (x, y, w, h) in enumerate(wins):
        photos += (f'    <Photo Name="Photo {i + 1}" Opacity="100" ShadowEnabled="False" ShadowColor="#FF000000" '
                   f'ShadowDepth="10" ShadowRadius="20" ShadowDirection="-45" Width="{w + 2 * bleed}" '
                   f'Height="{h + 2 * bleed}" Top="{y - bleed}" Left="{x - bleed}" ImagePath="" KeepAspect="False" '
                   f'Thickness="0" StrokeColor="#FF000000" PhotoNumber="{i + 1}" Rotation="0" ZIndex="{i}" '
                   'IsLocked="True" />\n')
    xml = ('\ufeff<?xml version="1.0" encoding="UTF-8"?>\n'
           f'<Template Name="Ceremonie des medailles 2026" IsFavorite="False" Width="1800" Height="1200" Dimensions="0" '
           'Resolution="300" BackgroundColor="#FFEBE3D8" print_2_per_page="False" PrintToSecondaryPrinter="False" '
           'LastSavedDate="11/13/2026 12:00:00">\n  <Elements>\n'
           f'    <Image Name="Cadre" Opacity="100" ShadowEnabled="False" ShadowColor="#FF000000" ShadowDepth="10" '
           f'ShadowRadius="20" ShadowDirection="-45" Width="1800" Height="1200" Top="0" Left="0" ImagePath="{png}" '
           f'KeepAspect="True" Thickness="0" StrokeColor="#FF000000" ZIndex="{len(wins)}" IsLocked="True" />\n'
           + photos + '  </Elements>\n</Template>\n')
    with open(os.path.join(out_dir, 'template.xml'), 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(xml)
    with zipfile.ZipFile(os.path.join(out_dir, f'{name}.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(out_dir, 'template.xml'), 'template.xml')
        z.write(os.path.join(out_dir, png), png)
    return [dict(Left=x - bleed, Top=y - bleed, Width=w + 2 * bleed, Height=h + 2 * bleed, fenetre=(x, y, w, h))
            for (x, y, w, h) in wins]


# ---------------------------------------------------------------- 2. pages d'accueil 1920x1080
SW, SH = 1920, 1080
LOOP, FPS = 24.0, 30
ICON_TOUCH = 0xE913


def font(name, size, axes=None, named=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    try:
        if axes:
            f.set_variation_by_axes(axes)
        elif named:
            f.set_variation_by_name(named)
    except Exception:
        pass
    return f


def sprite(F, a, key, scale):
    """Élément du modèle à l'échelle « scale » (par rapport au modèle 1x), en prémultiplié."""
    f, aa, (X0, Y0) = crop_group(F, a, key)
    s = scale / K
    w, h = max(1, int(round(aa.shape[1] * s))), max(1, int(round(aa.shape[0] * s)))
    P = cv2.resize(f * aa[..., None], (w, h), interpolation=cv2.INTER_AREA)
    A = cv2.resize(aa, (w, h), interpolation=cv2.INTER_AREA)
    return P, A, (X0 / K, Y0 / K)


def paste(canvas, P, A, x, y, alpha=1.0):
    h, w = A.shape
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(0, x), max(0, y), min(canvas.shape[1], x + w), min(canvas.shape[0], y + h)
    if x0 >= x1 or y0 >= y1:
        return
    p = P[y0 - y:y1 - y, x0 - x:x1 - x] * alpha
    aa = A[y0 - y:y1 - y, x0 - x:x1 - x][..., None] * alpha
    canvas[y0:y1, x0:x1] = p + canvas[y0:y1, x0:x1] * (1 - aa)


def text_mask(size, items):
    im = Image.new('L', size, 0)
    d = ImageDraw.Draw(im)
    for txt, f, xy, anchor in items:
        d.text(xy, txt, font=f, fill=255, anchor=anchor)
    return np.asarray(im, np.float32) / 255


def background():
    yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32)
    r = np.sqrt(((xx - SW * 0.36) / (SW * 0.75)) ** 2 + ((yy - SH * 0.42) / (SH * 0.95)) ** 2)
    c_in, c_out = np.array([243, 237, 229], np.float32), np.array([226, 215, 200], np.float32)
    bg = c_in * (1 - np.clip(r, 0, 1))[..., None] + c_out * np.clip(r, 0, 1)[..., None]
    glow = np.exp(-(((xx - 1470) / 520) ** 2 + ((yy - 520) / 470) ** 2))
    bg = bg + np.array([18, 12, 2], np.float32) * glow[..., None]
    rng = np.random.default_rng(5)
    bg += cv2.GaussianBlur(rng.normal(0, 2.2, (SH, SW)).astype(np.float32), (0, 0), 0.7)[..., None]
    return np.clip(bg, 0, 255)


class Scene:
    def __init__(self, F, a):
        self.bg = background()
        # éléments du modèle
        self.logo = sprite(F, a, 'logo', 1.80)
        self.batir = sprite(F, a, 'batir', 1.25)
        self.titre = sprite(F, a, 'titre', 1.30)
        self.medaille = sprite(F, a, 'medaille', 1.30)
        self.sous_titre = sprite(F, a, 'sous_titre', 1.30)
        self.filet = sprite(F, a, 'filet', 1.30)
        self.bouygues = sprite(F, a, 'bouygues', 1.15)
        lp = self.logo[1]
        self.logo_xy = (1470 - lp.shape[1] / 2, 540 - lp.shape[0] / 2)
        # colonne de gauche
        X = 140
        self.batir_xy = (X - 4, 112)
        # bloc titre (filet, titre, médaille, sous-titre) : disposition d'origine conservée, échelle 1,3
        S, ox, oy = 1.30, X, 372
        fx, fy = self.filet[2]
        for key in ('filet', 'titre', 'medaille', 'sous_titre'):
            gx, gy = getattr(self, key)[2]
            setattr(self, key + '_xy', (ox + (gx - fx) * S, oy + (gy - fy) * S))
        self.bouygues_xy = (X + 2, SH - 70 - self.bouygues[1].shape[0])
        # bouton « Touchez l'écran »
        self.pill = (X + 2, 640, 610, 150)
        self.build_button()
        # masque des chiffres dorés (pour les reflets), dans le repère du sprite logo
        P, A, (ox, oy) = self.logo
        C = P / np.maximum(A, 1e-3)[..., None]
        mx = C.max(-1)
        sat = (mx - C.min(-1)) / np.maximum(mx, 1)
        self.gold = (A * np.clip((sat - 0.2) / 0.15, 0, 1)).astype(np.float32)
        s = 1.80
        ox_, oy_ = GROUPS['logo'][0], GROUPS['logo'][1]
        # bandes verticales (coordonnées 1x du modèle) : 10, 20, 30, 40, « ans »
        rows = [(165, 270), (258, 357), (343, 445), (428, 528), (520, 556)]
        self.num_rows = [(int((r0 - oy) * s), int((r1 - oy) * s)) for r0, r1 in rows]

    def build_button(self):
        x, y, w, h = self.pill
        pad = 60
        W, H = w + 2 * pad, h + 2 * pad
        self.btn_origin = (x - pad, y - pad)
        # pilule orange avec légère ombre
        m = np.zeros((H * 4, W * 4), np.uint8)
        r = h // 2
        cv2.rectangle(m, ((pad + r) * 4, pad * 4), ((pad + w - r) * 4, (pad + h) * 4), 255, -1)
        cv2.circle(m, ((pad + r) * 4, (pad + r) * 4), r * 4, 255, -1, cv2.LINE_AA)
        cv2.circle(m, ((pad + w - r) * 4, (pad + r) * 4), r * 4, 255, -1, cv2.LINE_AA)
        m = cv2.resize(m.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_AREA)
        sh = cv2.GaussianBlur(np.roll(m, 8, 0), (0, 0), 12) * 0.35
        col = np.array(ORANGE, np.float32)
        yy = np.arange(H, dtype=np.float32)[:, None, None]
        grad = col + (np.array([20, 18, 10], np.float32) * (1 - (yy - pad) / h)).clip(-20, 20)
        P = np.zeros((H, W, 3), np.float32)
        A = sh.copy()
        P = grad * m[..., None] + 0 * P
        A = m + sh * (1 - m)
        # texte crème
        f1 = font('Archivo.ttf', 50, axes=[650, 88])
        f2 = font('Archivo.ttf', 36, axes=[460, 88])
        tx = pad + 168
        tm = text_mask((W, H), [("Touchez l'écran", f1, (tx, pad + h * 0.40), 'lm'),
                                ('pour commencer', f2, (tx + 2, pad + h * 0.71), 'lm')])
        cream = np.array([255, 248, 238], np.float32)
        P = P * (1 - tm[..., None]) + cream * tm[..., None]
        self.btn = (P, A)
        # main blanche
        self.icon_size = 104
        self.ic = (pad + 92, pad + h / 2 + 12)
        fi = ImageFont.truetype(os.path.join(FONTS, 'MaterialIcons.ttf'), self.icon_size)
        self.hand = text_mask((W, H), [(chr(ICON_TOUCH), fi, self.ic, 'mm')])
        self.tip = (self.ic[0] - 0.02 * self.icon_size, self.ic[1] - 0.1875 * self.icon_size)

    def button_frame(self, t, period=2.4):
        P, A = self.btn
        H, W = A.shape
        u = t % period
        if u < 0.16:
            k = u / 0.16
        elif u < 0.42:
            k = 1 - (u - 0.16) / 0.26
        else:
            k = 0.0
        k = k * k * (3 - 2 * k)
        cx, cy = self.tip
        # pilule qui « respire » légèrement à l'appui
        s = 1 - 0.018 * k
        x, y, w, h = self.pill
        pc = (x - self.btn_origin[0] + w / 2, y - self.btn_origin[1] + h / 2)
        M = np.float32([[s, 0, (1 - s) * pc[0]], [0, s, (1 - s) * pc[1]]])
        P2 = cv2.warpAffine(P, M, (W, H))
        A2 = cv2.warpAffine(A, M, (W, H))
        # ondes crème autour du doigt
        rings = np.zeros((H, W), np.float32)
        for lag in (0.0, 0.26):
            v = u - 0.14 - lag
            if 0 <= v < 1.2:
                p = v / 1.2
                rad = 0.19 * self.icon_size + p * 0.62 * self.icon_size
                ring = np.zeros((H, W), np.float32)
                cv2.circle(ring, (int(round(cx * 4)), int(round(cy * 4))), int(round(rad * 4)), 1.0, 12, cv2.LINE_AA, shift=2)
                rings = np.maximum(rings, ring * (1 - p) ** 1.5)
        cream = np.array([255, 244, 225], np.float32)
        P2 = P2 * (1 - rings[..., None]) + cream * rings[..., None]
        A2 = np.maximum(A2, rings)
        # main (appui : descend et rétrécit)
        sc = 1 - 0.07 * k
        Mh = np.float32([[sc, 0, (1 - sc) * cx], [0, sc, (1 - sc) * cy + 6 * k]])
        hm = cv2.warpAffine(self.hand, Mh, (W, H))
        P2 = P2 * (1 - hm[..., None]) + np.array([255, 252, 246], np.float32) * hm[..., None]
        A2 = np.maximum(A2, hm)
        return P2 * 1.0, A2

    def medal_sprite(self, t):
        P, A, _ = self.medaille
        ang = 7.0 * math.sin(2 * math.pi * t / 3.0)
        h, w = A.shape
        M = cv2.getRotationMatrix2D((w / 2, 2), ang, 1.0)
        pad = 12
        M[0, 2] += pad
        M[1, 2] += pad
        size = (w + 2 * pad, h + 2 * pad)
        return cv2.warpAffine(P, M, size, flags=cv2.INTER_CUBIC), cv2.warpAffine(A, M, size, flags=cv2.INTER_LINEAR), pad

    def logo_frame(self, t, shine=True):
        P, A, _ = self.logo
        if not shine:
            return P, A
        u = t % 8.0
        h, w = A.shape
        out = P.copy()
        xx = np.arange(w, dtype=np.float32)[None, :]
        for i, (r0, r1) in enumerate(self.num_rows):
            st = 0.6 + 0.42 * i
            p = (u - st) / 0.95
            if not (0 <= p <= 1):
                continue
            r0, r1 = max(0, r0), min(h, r1)
            yy = np.arange(r0, r1, dtype=np.float32)[:, None]
            pos = -150 + p * (w + 300)
            band = np.exp(-((xx + 0.45 * (yy - r0) - pos) / 46.0) ** 2) * math.sin(math.pi * p) ** 0.6
            g = self.gold[r0:r1] * band
            target = np.array([255, 246, 220], np.float32) * A[r0:r1][..., None]
            out[r0:r1] = out[r0:r1] + (target - out[r0:r1]) * (0.75 * g)[..., None]
        return out, A

    def render(self, t, animated=True, confetti=None):
        c = self.bg.copy()
        lp, la = self.logo_frame(t, shine=animated)
        paste(c, lp, la, *self.logo_xy)
        for key in ('batir', 'filet', 'titre', 'sous_titre', 'bouygues'):
            P, A, _ = getattr(self, key)
            paste(c, P, A, *getattr(self, key + '_xy'))
        mp, ma, pad = self.medal_sprite(t if animated else 0.0)
        paste(c, mp, ma, self.medaille_xy[0] - pad, self.medaille_xy[1] - pad)
        bp, ba = self.button_frame(t if animated else 0.6)
        paste(c, bp, ba, *self.btn_origin)
        if confetti is not None:
            confetti.draw(c, t)
        return c


class Confetti:
    """Confettis dorés qui tombent en tournoyant ; boucle parfaite de LOOP secondes."""
    COLORS = [(214, 168, 88), (236, 205, 140), (190, 140, 70), (232, 75, 4), (150, 105, 55)]

    def __init__(self, n=30, seed=21, avoid=None):
        rng = np.random.default_rng(seed)
        self.p = [dict(x=rng.uniform(0, SW), y0=rng.uniform(0, 1), laps=int(rng.choice([1, 1, 2])),
                       w=rng.uniform(10, 15), h=rng.uniform(16, 26), col=self.COLORS[int(rng.choice(5, p=[.38, .34, .14, .09, .05]))],
                       spin=int(rng.integers(2, 6)), sph=rng.uniform(0, 6.28), rot=rng.uniform(0, 360),
                       rots=int(rng.choice([-2, -1, 1, 2])), amp=rng.uniform(15, 50), k=int(rng.integers(1, 4)),
                       ph=rng.uniform(0, 6.28), a=rng.uniform(0.75, 0.95)) for _ in range(n)]
        self.avoid = avoid

    def draw(self, c, t, margin=40):
        span = SH + 2 * margin
        for q in self.p:
            y = (q['y0'] * span + span * q['laps'] * t / LOOP) % span - margin
            x = q['x'] + q['amp'] * math.sin(2 * math.pi * q['k'] * t / LOOP + q['ph'])
            flip = math.cos(2 * math.pi * q['spin'] * t / LOOP + q['sph'])
            ang = math.radians(q['rot'] + 360 * q['rots'] * t / LOOP)
            hw, hh = q['w'] / 2 * max(0.35, abs(flip)), q['h'] / 2
            ca, sa = math.cos(ang), math.sin(ang)
            pts = np.array([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], np.float32) @ np.array([[ca, sa], [-sa, ca]], np.float32)
            pts += [x, y]
            x0, y0 = int(max(0, pts[:, 0].min() - 2)), int(max(0, pts[:, 1].min() - 2))
            x1, y1 = int(min(SW, pts[:, 0].max() + 3)), int(min(SH, pts[:, 1].max() + 3))
            if x0 >= x1 or y0 >= y1:
                continue
            m = np.zeros((y1 - y0, x1 - x0), np.float32)
            cv2.fillPoly(m, [np.round((pts - [x0, y0]) * 4).astype(np.int32)], 1.0, cv2.LINE_AA, shift=2)
            al = m * q['a']
            if self.avoid is not None:
                al = al * (1 - 0.85 * self.avoid[y0:y1, x0:x1])
            shade = 0.8 + 0.2 * abs(flip)
            col = np.array(q['col'], np.float32) * shade
            c[y0:y1, x0:x1] = c[y0:y1, x0:x1] * (1 - al[..., None]) + col * al[..., None]


def avoid_mask(scene):
    """Zones où les confettis s'effacent presque : textes, bouton, logo Bouygues."""
    m = np.zeros((SH, SW), np.float32)
    for key in ('batir', 'titre', 'sous_titre', 'bouygues'):
        P, A, _ = getattr(scene, key)
        x, y = [int(round(v)) for v in getattr(scene, key + '_xy')]
        m[max(0, y - 20):y + A.shape[0] + 20, max(0, x - 20):x + A.shape[1] + 20] = 1
    x, y, w, h = scene.pill
    m[y - 30:y + h + 30, x - 30:x + w + 30] = 1
    return cv2.GaussianBlur(m, (0, 0), 18)


def finish(c, amount=0.3):
    s = c + amount * (c - cv2.GaussianBlur(c, (0, 0), 0.9))
    return Image.fromarray(np.clip(np.round(s), 0, 255).astype(np.uint8))


def render_video(scene, path):
    conf = Confetti(avoid=avoid_mask(scene))
    n = int(round(LOOP * FPS))
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{SW}x{SH}', '-r', str(FPS),
           '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
           '-movflags', '+faststart', path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k in range(n):
        t = k / FPS
        fr = finish(scene.render(t, True, conf))
        proc.stdin.write(np.asarray(fr).tobytes())
        if k == 0:
            fr.save(path.replace('.mp4', '_apercu.jpg'), quality=92)
    proc.stdin.close()
    proc.wait()
    return n


if __name__ == '__main__':
    what = sys.argv[1:] or ['modele', 'accueil', 'anime']
    out = os.path.join(BB, 'out')
    os.makedirs(out, exist_ok=True)
    F, a = extract_layer()
    if 'modele' in what:
        for variant, name in (('fidele', 'Bouygues_Medailles_2026_A_fidele'), ('photo32', 'Bouygues_Medailles_2026_B_photo_3x2'),
                              ('deux_photos', 'Bouygues_Medailles_2026_C_2photos')):
            rgba, wins = build_print(F, a, variant)
            info = write_lumabooth(rgba, wins, os.path.join(out, 'LumaBooth', variant), name=name)
            print('modele', variant, info)
    if 'accueil' in what or 'anime' in what:
        sc = Scene(F, a)
        if 'accueil' in what:
            finish(sc.render(0.0, animated=False)).save(os.path.join(out, 'accueil_medailles_1920x1080.png'), optimize=True)
            finish(sc.render(0.0, animated=False)).save(os.path.join(out, 'accueil_medailles_1920x1080.jpg'), quality=95)
        if 'anime' in what:
            print('video', render_video(sc, os.path.join(out, 'accueil_medailles_anime_1920x1080.mp4')))
    print('ok')
