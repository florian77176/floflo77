"""Pages d'accueil (écran de démarrage) LumaBooth, 1920x1080, tirées du modèle 3 photos paysage.

Construction en calques (calculés une seule fois, en 2x puis ramenés à l'écran) :
  - « dessus » : fond d'origine + cadres dorés réguliers + décors posés devant (verres, ballon transparent),
    fenêtres transparentes (couleur prémultipliée + alpha) ;
  - « contenu » : ce qui se voit dans les fenêtres (panneaux dorés ou photos).
Mise au format 16:9 sans déformation : bande gardée du dessus des cadres à sous la date, côtés prolongés
en miroir sur quelques pixels.

Sorties (dossier out/) :
  accueil_1920x1080.png / .jpg      les trois étapes (1 Touchez, 2 Prenez la pose, 3 Découvrez)
  accueil_1920x1080_sans_texte.png  icônes seules
  accueil_photos_1920x1080.png      Jordan bébé | « Touchez l'écran pour commencer » | Jordan aujourd'hui
  accueil_anime_1920x1080.mp4       boucle de 35 s : les photos défilent dans les cadres de côté

Usage (depuis le dossier de travail src/ base/ x4/ out/ fonts/ jordan/) :
  python3 accueil.py [etapes] [photos] [anime]
Polices (Google Fonts, licence OFL) : Cinzel, Cormorant Garamond ; icônes : Material Icons (Apache 2.0).
"""
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *  # noqa
from keying import refine_quad, offset_quad
from regulier import border_strips, draw_frames
from fidele import SPECS, place, front_mask, old_overlay
from PIL import ImageDraw, ImageFont

K = 2                      # travail en 2x (3600x2400) puis réduction : rendu net
ROWS = (90, 1126)          # bande gardée (coordonnées 1200) : du dessus des cadres à sous la date
OUT_W, OUT_H = 1920, 1080
FONTS = os.path.join(os.getcwd(), 'fonts')
GOLD = [(252, 236, 186), (240, 205, 128), (205, 150, 62), (246, 216, 140)]   # dégradé doré (haut -> bas)
ICONS = {'touch_app': 0xE913, 'photo_camera': 0xE412, 'photo_library': 0xE413}

STEPS = [
    dict(num='1', icon='touch_app', lines=["Touchez l'écran", 'pour commencer']),
    dict(num='2', icon='photo_camera', lines=['Prenez la pose', 'et souriez !']),
    dict(num='3', icon='photo_library', lines=['Découvrez', 'votre photo']),
]
CTA = dict(num='', icon='touch_app', lines=["Touchez l'écran", 'pour commencer'], cta=True)

# photos de Jordan : fichier, centre (x, y) et hauteur du cadrage dans la photo d'origine
PHOTOS = {
    'p01': (520, 700, 1100), 'p02': (660, 900, 1150), 'p03': (680, 690, 1280), 'p04': (650, 660, 1240),
    'p05': (800, 790, 820), 'p06': (640, 800, 1100), 'p07': (640, 740, 1180), 'p08': (665, 640, 1140),
    'p09': (740, 600, 1150), 'p10': (660, 520, 860),
}
STATIC_LEFT, STATIC_RIGHT = 'p03', 'p08'                          # bébé | aujourd'hui
ANIM_LEFT = ['p03', 'p06', 'p07', 'p02', 'p05']                   # ordre de passage, cadre de gauche
ANIM_RIGHT = ['p08', 'p01', 'p04', 'p09', 'p10']                  # cadre de droite (décalé d'une demi-période)
SHOW, FADE, FPS = 7.0, 1.0, 30                                    # 5 photos x 7 s = boucle de 35 s


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight:
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
    return f


def gold_layer(mask):
    """Dégradé doré vertical calé sur la hauteur du tracé, bord haut éclairci."""
    H, W = mask.shape
    ys = np.nonzero(mask.max(axis=1) > 0.05)[0]
    y0, y1 = (ys[0], ys[-1]) if len(ys) else (0, H - 1)
    t = np.clip((np.arange(H) - y0) / max(1, y1 - y0), 0, 1)
    stops = np.linspace(0, 1, len(GOLD))
    col = np.stack([np.interp(t, stops, [c[k] for c in GOLD]) for k in range(3)], -1)[:, None, :]
    col = np.broadcast_to(col, (H, W, 3)).astype(np.float32)
    hl = np.clip(mask - np.roll(mask, 2, axis=0), 0, 1)[..., None]
    return np.clip(col + 40 * hl, 0, 255)


def draw_text_mask(size, items):
    im = Image.new('L', size, 0)
    d = ImageDraw.Draw(im)
    for txt, f, (cx, cy) in items:
        d.text((cx, cy), txt, font=f, fill=255, anchor='mm')
    return np.asarray(im, np.float32) / 255


def panel_image(w, h, step, glow_gain=0.6, icon=True):
    """Contenu d'une fenêtre : bleu nuit pailleté + numéro, icône et texte dorés (taille w x h)."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h * 0.45) / (h * 0.75)) ** 2)
    c0, c1 = np.array([30, 52, 98], np.float32), np.array([9, 20, 46], np.float32)
    base = c0 * (1 - np.clip(r, 0, 1))[..., None] + c1 * np.clip(r, 0, 1)[..., None]
    rng = np.random.default_rng(len(step['icon']))
    base += rng.normal(0, 1.6, (h, w, 1)).astype(np.float32)
    sp = np.zeros((h, w), np.float32)
    for _ in range(int(w * h / 9000)):
        x, y = rng.integers(0, w), rng.integers(0, h)
        cv2.circle(sp, (int(x), int(y)), max(1, int(rng.uniform(1.2, 3.2) * w / 1100)), float(rng.uniform(0.25, 0.7)), -1, cv2.LINE_AA)
    sp = cv2.GaussianBlur(sp, (0, 0), 0.8)
    img = base * (1 - sp[..., None]) + np.array([235, 196, 120], np.float32) * sp[..., None]
    s = h / 1140.0
    f_ico = lambda size: ImageFont.truetype(os.path.join(FONTS, 'MaterialIcons.ttf'), int(size * s))
    if step.get('cta'):     # appel à l'action seul : icône et texte plus grands
        items = [(chr(ICONS[step['icon']]) if icon else '', f_ico(400), (w / 2, h * 0.37)),
                 (step['lines'][0], font('Cormorant.ttf', int(132 * s), 'SemiBold'), (w / 2, h * 0.68)),
                 (step['lines'][1], font('CormorantItalic.ttf', int(104 * s), 'Medium'), (w / 2, h * 0.79))]
    elif step['num']:
        items = [(step['num'], font('Cinzel.ttf', int(150 * s), 'Bold'), (w / 2, h * 0.14)),
                 (chr(ICONS[step['icon']]), f_ico(330), (w / 2, h * 0.41)),
                 (step['lines'][0], font('Cormorant.ttf', int(118 * s), 'SemiBold'), (w / 2, h * 0.66)),
                 (step['lines'][1], font('CormorantItalic.ttf', int(92 * s), 'Medium'), (w / 2, h * 0.765))]
    else:                   # sans texte : icône seule
        items = [(chr(ICONS[step['icon']]), f_ico(440), (w / 2, h * 0.5))]
    m = draw_text_mask((w, h), items)
    if step['num']:
        line = np.zeros((h, w), np.float32)
        cv2.line(line, (int(w * 0.40), int(h * 0.225)), (int(w * 0.60), int(h * 0.225)), 1.0, max(1, int(3 * s)), cv2.LINE_AA)
        m = np.maximum(m, line)
    shadow = cv2.GaussianBlur(m, (0, 0), 6 * s)
    shadow = np.roll(np.roll(shadow, int(5 * s), 0), int(3 * s), 1)
    img = img * (1 - 0.65 * shadow[..., None])
    glow = cv2.GaussianBlur(m, (0, 0), 14 * s) + 0.5 * cv2.GaussianBlur(m, (0, 0), 40 * s)
    img = img + np.array([60, 45, 15], np.float32) * glow[..., None] * glow_gain
    img = img * (1 - m[..., None]) + gold_layer(m) * m[..., None]
    return np.clip(img, 0, 255)


# ---------------------------------------------------------------- calques (2x) et passage à l'écran
def build_layers():
    W1, H1 = 1800, 1200
    W, H = W1 * K, H1 * K
    rgb = np.array(Image.open(os.path.join(os.getcwd(), 'x4', '3photos.png')).convert('RGB').resize((W, H), Image.LANCZOS))
    base1 = base_image('3photos', (W1, H1))
    quads1 = [refine_quad(base1, b)[0] for b in white_windows(base1)]
    quads = [q * K for q in quads1]
    hole = np.zeros((H, W), np.uint8)
    for q in quads:
        cv2.fillPoly(hole, [np.round(offset_quad(q, 17 * K)).astype(np.int32)], 255)
    bg = cv2.inpaint(rgb, cv2.dilate(hole, np.ones((5, 5), np.uint8)), 7, cv2.INPAINT_TELEA)
    frames = []
    for q1, f in zip(quads1, SPECS['3photos']['frames']):
        cx, cy = place(q1, f)
        frames.append(dict(cx=cx * K, cy=cy * K, w=f['w'] * K, h=f['h'] * K, angle=f['angle'], border=15 * K))
    strips = [border_strips(rgb, q, rows=(K, 16 * K), trim_rows=True) for q in quads]
    rf = draw_frames(bg, frames, strips, [0, 1, 2], shadow=False)
    P = rf[..., :3] * rf[..., 3:4]
    A = rf[..., 3].copy()
    # décors devant : rendu détouré d'origine agrandi (couleur nette de l'image 2x là où il est opaque)
    fm = cv2.resize(front_mask('3photos', (H1, W1)), (W, H), interpolation=cv2.INTER_LINEAR)
    oc, oa = old_overlay('3photos', base1)
    oc2 = cv2.resize(oc, (W, H), interpolation=cv2.INTER_CUBIC)
    oa2 = cv2.resize(oa, (W, H), interpolation=cv2.INTER_LINEAR)
    deco = np.where((oa2 > 0.98)[..., None], rgb.astype(np.float32), oc2)
    a = (fm * oa2)[..., None]
    P = deco * a + P * (1 - a)
    A = a[..., 0] + A * (1 - a[..., 0])
    return P, A, frames


def screen_geometry():
    """Recadrage 16:9 : bande ROWS (en 2x), côtés prolongés en miroir, puis réduction à 1920x1080."""
    y0, y1 = ROWS[0] * K, ROWS[1] * K
    need_w = (y1 - y0) * OUT_W / OUT_H
    pad = int(round((need_w - 1800 * K) / 2))
    s = OUT_W / (1800 * K + 2 * pad)
    return y0, y1, pad, s


def to_screen(arr, darken=False):
    """Bande 16:9 ; les quelques pixels ajoutés sur les côtés sont flous et fondus dans le bleu nuit."""
    y0, y1, pad, s = screen_geometry()
    a = arr[y0:y1].astype(np.float32)
    a = cv2.copyMakeBorder(a, 0, 0, pad, pad, cv2.BORDER_REFLECT)
    W = a.shape[1]
    blur = cv2.GaussianBlur(a, (0, 0), 10)
    x = np.arange(W, dtype=np.float32)
    d = np.minimum(x, W - 1 - x)                                   # distance au bord
    wb = np.clip(1 - (d - pad) / 30.0, 0, 1)                       # 1 dans la marge, fondu sur 30 px
    wb = wb.reshape((1, W) + (1,) * (a.ndim - 2))
    a = a * (1 - wb) + blur * wb
    if darken:
        shade = 1 - 0.45 * np.clip(1 - d / (pad + 60.0), 0, 1) ** 1.5
        a = a * shade.reshape((1, W) + (1,) * (a.ndim - 2))
    return cv2.resize(a, (OUT_W, OUT_H), interpolation=cv2.INTER_AREA)


def frame_on_screen(fr):
    y0, y1, pad, s = screen_geometry()
    return dict(cx=(fr['cx'] + pad) * s, cy=(fr['cy'] - y0) * s, w=fr['w'] * s, h=fr['h'] * s, angle=fr['angle'])


def place_content(content, img, fr, alpha=1.0, extra=12):
    """Pose une image (déjà à la taille de la fenêtre + 2*extra) dans la fenêtre tournée, sur content."""
    ph, pw = img.shape[:2]
    M = cv2.getRotationMatrix2D((pw / 2, ph / 2), -fr['angle'], 1.0)
    M[0, 2] += fr['cx'] - pw / 2
    M[1, 2] += fr['cy'] - ph / 2
    x0 = max(0, int(fr['cx'] - pw)); x1 = min(content.shape[1], int(fr['cx'] + pw))
    y0 = max(0, int(fr['cy'] - ph)); y1 = min(content.shape[0], int(fr['cy'] + ph))
    M2 = M.copy(); M2[0, 2] -= x0; M2[1, 2] -= y0
    warped = cv2.warpAffine(img, M2, (x1 - x0, y1 - y0), flags=cv2.INTER_CUBIC)
    mk = cv2.warpAffine(np.ones((ph, pw), np.float32), M2, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR) * alpha
    reg = content[y0:y1, x0:x1]
    content[y0:y1, x0:x1] = reg * (1 - mk[..., None]) + warped * mk[..., None]


_PHOTO_CACHE = {}
_SHADE_CACHE = {}


def grade_photo(x):
    """Étalonnage commun et doux : dominantes atténuées, légère chaleur dorée, contraste en S, saturation -6 %."""
    x = x / 255.0
    h, w, _ = x.shape
    m = x[h // 6:5 * h // 6, w // 6:5 * w // 6].reshape(-1, 3).mean(0)
    x = x * (m.mean() / np.maximum(m, 1e-3)) ** 0.35
    x = x * np.array([1.035, 1.0, 0.95], np.float32)
    x = np.clip(x, 0, 1)
    x = x * 0.8 + (x * x * (3 - 2 * x)) * 0.2
    lum = (x * np.array([0.299, 0.587, 0.114], np.float32)).sum(-1, keepdims=True)
    x = lum + (x - lum) * 0.94
    return np.clip(x * 255, 0, 255).astype(np.float32)


def inner_shade(w, h, extra):
    """Ombre intérieure sous la dorure + vignette légère (la photo paraît posée dans le cadre)."""
    key = (w, h, extra)
    if key not in _SHADE_CACHE:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.minimum.reduce([xx - extra, w - 1 - extra - xx, yy - extra, h - 1 - extra - yy])
        sh = 1 - 0.30 * np.exp(-np.maximum(d, 0) / 9.0)
        r2 = ((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2
        _SHADE_CACHE[key] = (sh * (1 - 0.10 * r2))[..., None].astype(np.float32)
    return _SHADE_CACHE[key]


def photo_view(key, w, h, zoom=1.0, pan=0.0):
    """Cadrage w x h d'une photo de Jordan : zoom ancré sur le visage (Ken Burns), panoramique en fraction."""
    if key not in _PHOTO_CACHE:
        raw = np.array(Image.open(os.path.join(os.getcwd(), 'jordan', f'{key}.jpg')).convert('RGB')).astype(np.float32)
        _PHOTO_CACHE[key] = grade_photo(raw)
    src = _PHOTO_CACHE[key]
    cx0, cy0, ch0 = PHOTOS[key]
    ax, ay = cx0, cy0 - 0.12 * ch0                      # point fixe du zoom : le visage
    ch = ch0 / zoom
    cw = ch * w / h
    cx = ax + (cx0 - ax) / zoom + pan * ch0 * 0.04
    cy = ay + (cy0 - ay) / zoom
    cx = min(max(cx, cw / 2), src.shape[1] - cw / 2)
    cy = min(max(cy, ch / 2), src.shape[0] - ch / 2)
    sc = w / cw
    M = np.float32([[sc, 0, -(cx - cw / 2) * sc], [0, sc, -(cy - ch / 2) * sc]])
    return cv2.warpAffine(src, M, (int(w), int(h)), flags=cv2.INTER_AREA if sc < 1 else cv2.INTER_CUBIC)


def compose(P, A, content):
    out = P + content * (1 - A)[..., None]
    return np.clip(out, 0, 255)


def finish(arr, amount=0.5):
    sharp = arr + amount * (arr - cv2.GaussianBlur(arr, (0, 0), 0.9))
    return Image.fromarray(np.clip(np.round(sharp), 0, 255).astype(np.uint8))


def panel_for(fr, step, extra=12, **kw):
    pw, ph = int(round(fr['w'])) + 2 * extra, int(round(fr['h'])) + 2 * extra
    return panel_image(pw, ph, step, **kw)


def photo_for(fr, key, zoom=1.0, extra=12, pan=0.0):
    pw, ph = int(round(fr['w'])) + 2 * extra, int(round(fr['h'])) + 2 * extra
    return photo_view(key, pw, ph, zoom, pan) * inner_shade(pw, ph, extra)


# ---------------------------------------------------------------- scintillements et reflet sur le titre
def sparkle_points(P, A, frames_s, n=14, seed=3):
    """Petits points dorés du décor (hors fenêtres et titre) qui scintilleront."""
    rgb = np.clip(P / np.maximum(A, 1e-3)[..., None], 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    bright = ((hsv[..., 2] > 200) & (hsv[..., 1] > 60)).astype(np.uint8)
    nl, lab, st, cen = cv2.connectedComponentsWithStats(bright)
    H, W = A.shape
    forbid = np.zeros((H, W), np.uint8)
    for fr in frames_s:
        box = cv2.boxPoints(((fr['cx'], fr['cy']), (fr['w'] + 60, fr['h'] + 60), fr['angle']))
        cv2.fillPoly(forbid, [np.round(box).astype(np.int32)], 1)
    forbid[int(H * 0.55):, int(W * 0.28):int(W * 0.72)] = 1          # titre
    cand = [tuple(cen[i]) for i in range(1, nl) if 6 <= st[i, 4] <= 120 and not forbid[int(cen[i][1]), int(cen[i][0])]]
    rng = np.random.default_rng(seed)
    rng.shuffle(cand)
    pts = []
    for c in cand:
        if all(math.hypot(c[0] - p[0], c[1] - p[1]) > 140 for p in pts):
            pts.append(c)
        if len(pts) >= n:
            break
    return [dict(x=p[0], y=p[1], size=rng.uniform(10, 20), period=float(rng.choice([3.5, 5.0, 7.0])),
                 phase=rng.uniform(0, 1)) for p in pts]


def star_sprite(size):
    r = int(size * 2)
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32)
    d = np.sqrt(xx ** 2 + yy ** 2)
    core = np.exp(-(d / (size * 0.18)) ** 2)
    rays = np.exp(-(np.abs(xx) / (size * 0.06)) ** 2) * np.exp(-(np.abs(yy) / size) ** 2) + \
           np.exp(-(np.abs(yy) / (size * 0.06)) ** 2) * np.exp(-(np.abs(xx) / size) ** 2)
    return np.clip(core + 0.8 * rays, 0, 1)


def title_mask(P, A):
    rgb = np.clip(P / np.maximum(A, 1e-3)[..., None], 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    H, W = A.shape
    m = ((hsv[..., 1] > 70) & (hsv[..., 2] > 150)).astype(np.float32)
    zone = np.zeros((H, W), np.float32)
    zone[int(H * 0.575):, int(W * 0.25):int(W * 0.75)] = 1
    return cv2.GaussianBlur(m * zone, (0, 0), 0.7)


# ---------------------------------------------------------------- bouton « touchez » animé
class TapButton:
    """Panneau central : texte fixe, main dorée qui appuie toutes les PERIOD s, ondes dorées depuis le doigt."""
    PERIOD = 2.5

    def __init__(self, fr, extra=12):
        self.pw, self.ph = int(round(fr['w'])) + 2 * extra, int(round(fr['h'])) + 2 * extra
        w, h = self.pw, self.ph
        self.base = panel_image(w, h, CTA, glow_gain=0.6, icon=False)
        sc = h / 1140.0
        self.size = int(400 * sc)
        self.ic = (w / 2, h * 0.37)
        f = ImageFont.truetype(os.path.join(FONTS, 'MaterialIcons.ttf'), self.size)
        m = draw_text_mask((w, h), [(chr(ICONS['touch_app']), f, self.ic)])
        self.m = m
        self.gold = gold_layer(m)
        sh = cv2.GaussianBlur(m, (0, 0), 6 * sc)
        self.sh = np.roll(np.roll(sh, int(5 * sc), 0), int(3 * sc), 1)
        self.gl = cv2.GaussianBlur(m, (0, 0), 14 * sc) + 0.5 * cv2.GaussianBlur(m, (0, 0), 40 * sc)
        # centre de l'arc autour du bout du doigt (mesuré sur le glyphe : -0,02 / -0,1875 de la taille)
        self.tip = (self.ic[0] - 0.02 * self.size, self.ic[1] - 0.1875 * self.size)
        self.r0 = 0.19 * self.size
        self.sc = sc

    def frame(self, t):
        w, h = self.pw, self.ph
        u = t % self.PERIOD
        # appui : descente 0-0,18 s, remontée 0,18-0,45 s
        if u < 0.18:
            k = u / 0.18
        elif u < 0.45:
            k = 1 - (u - 0.18) / 0.27
        else:
            k = 0.0
        k = k * k * (3 - 2 * k)
        dy, scl = 10 * self.sc * k, 1 - 0.06 * k
        cx, cy = self.tip
        M = np.float32([[scl, 0, (1 - scl) * cx], [0, scl, (1 - scl) * cy + dy]])
        warp = lambda a: cv2.warpAffine(a, M, (w, h), flags=cv2.INTER_LINEAR)
        img = self.base.copy()
        # ondes (sous la main)
        rings = np.zeros((h, w), np.float32)
        for lag in (0.0, 0.28):
            v = u - 0.16 - lag
            if 0 <= v < 1.3:
                p = v / 1.3
                r = self.r0 + p * 0.42 * self.size
                a = (1 - p) ** 1.6
                ring = np.zeros((h, w), np.float32)
                cv2.circle(ring, (int(round(cx * 4)), int(round(cy * 4))), int(round(r * 4)), 1.0,
                           max(1, int(round(4 * 3.2 * self.sc))), cv2.LINE_AA, shift=2)
                rings = np.maximum(rings, ring * a)
        if rings.max() > 0:
            glow = cv2.GaussianBlur(rings, (0, 0), 5 * self.sc)
            img = img + np.array([110, 80, 25], np.float32) * glow[..., None] * 1.0
            img = img * (1 - rings[..., None]) + np.array([244, 204, 122], np.float32) * rings[..., None]
        # main
        gain = 0.6 + 1.2 * k
        img = img * (1 - 0.65 * warp(self.sh)[..., None])
        img = img + np.array([60, 45, 15], np.float32) * warp(self.gl)[..., None] * gain
        m = warp(self.m)[..., None]
        img = img * (1 - m) + warp(self.gold) * m
        return np.clip(img, 0, 255)


# ---------------------------------------------------------------- paillettes qui flottent (boucle parfaite)
def make_particles(n=46, seed=11, loop=35.0):
    rng = np.random.default_rng(seed)
    return [dict(x0=rng.uniform(0, OUT_W), y0=rng.uniform(0, 1), r=rng.uniform(2.0, 7.5), a=rng.uniform(0.25, 0.75),
                 laps=int(rng.choice([1, 1, 2])), amp=rng.uniform(6, 26), k=int(rng.integers(1, 4)), ph=rng.uniform(0, 6.28),
                 tw=int(rng.integers(3, 8)), tph=rng.uniform(0, 6.28)) for _ in range(n)]


_DOT = {}


def dot_sprite(r):
    key = round(r * 2) / 2
    if key not in _DOT:
        R = int(math.ceil(key * 3))
        yy, xx = np.mgrid[-R:R + 1, -R:R + 1].astype(np.float32)
        d = np.sqrt(xx ** 2 + yy ** 2)
        _DOT[key] = (np.exp(-(d / key) ** 2) + 0.35 * np.exp(-(d / (key * 2.4)) ** 2)).clip(0, 1)
    return _DOT[key]


def draw_particles(out, parts, t, mask, loop=35.0, margin=40):
    span = OUT_H + 2 * margin
    col = np.array([255, 224, 160], np.float32)
    for q in parts:
        y = (q['y0'] * span - span * q['laps'] * t / loop) % span - margin
        x = q['x0'] + q['amp'] * math.sin(2 * math.pi * q['k'] * t / loop + q['ph'])
        tw = 0.65 + 0.35 * math.sin(2 * math.pi * q['tw'] * t / loop + q['tph'])
        sp = dot_sprite(q['r'])
        R = sp.shape[0] // 2
        xi, yi = int(round(x)), int(round(y))
        x0, x1, y0, y1 = max(0, xi - R), min(OUT_W, xi + R + 1), max(0, yi - R), min(OUT_H, yi + R + 1)
        if x0 >= x1 or y0 >= y1:
            continue
        s_ = sp[y0 - yi + R:y1 - yi + R, x0 - xi + R:x1 - xi + R] * q['a'] * tw * mask[y0:y1, x0:x1]
        reg = out[y0:y1, x0:x1]
        out[y0:y1, x0:x1] = reg + (col - reg) * s_[..., None]


def window_mask(fr, shape, grow=0):
    m = np.zeros(shape, np.float32)
    box = cv2.boxPoints(((fr['cx'], fr['cy']), (fr['w'] + 2 * grow, fr['h'] + 2 * grow), fr['angle']))
    cv2.fillPoly(m, [np.round(box * 4).astype(np.int32)], 1.0, cv2.LINE_AA, shift=2)
    return m


def wipe_slot(fr, states, extra=12):
    """Image d'un cadre : photo courante, et pendant la transition, balayage diagonal (de gauche à droite)
    vers la suivante, avec un trait de lumière dorée sur le front du balayage."""
    key, z, _, pan = states[0]
    img = photo_for(fr, key, z, pan=pan)
    if len(states) == 1:
        return img
    key2, z2, a, pan2 = states[1]
    nxt = photo_for(fr, key2, z2, pan=pan2)
    ph, pw = img.shape[:2]
    yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
    c = (xx / pw) * 0.78 + (yy / ph) * 0.22
    pos = -0.12 + a * 1.24
    m = np.clip((pos - c) / 0.07 + 0.5, 0, 1)
    m = (m * m * (3 - 2 * m))[..., None]
    out = img * (1 - m) + nxt * m
    band = (np.exp(-((c - pos) / 0.028) ** 2) * 0.55 + np.exp(-((c - pos) / 0.09) ** 2) * 0.18) * math.sin(math.pi * a) ** 0.5
    return out + (np.array([255, 232, 176], np.float32) - out) * band[..., None]


def glint(out, fr, wm, a, strength=0.30):
    """Reflet doré qui traverse la fenêtre pendant le fondu (a : 0 -> 1)."""
    g = strength * math.sin(math.pi * a)
    if g < 0.01:
        return
    box = cv2.boxPoints(((fr['cx'], fr['cy']), (fr['w'], fr['h']), fr['angle']))
    x0, y0 = np.floor(box.min(0)).astype(int)
    x1, y1 = np.ceil(box.max(0)).astype(int)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(OUT_W, x1), min(OUT_H, y1)
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    span = (x1 - x0) + 0.5 * (y1 - y0)
    pos = x0 - 0.25 * (y1 - y0) + a * (span + 120) - 60
    band = np.exp(-((xx + 0.5 * (yy - y0) - pos) / 55.0) ** 2) * wm[y0:y1, x0:x1]
    reg = out[y0:y1, x0:x1]
    out[y0:y1, x0:x1] = reg + (np.array([255, 236, 190], np.float32) - reg) * (g * band)[..., None]


# ---------------------------------------------------------------- sorties
def render_steps(P, A, fr_s, with_text=True):
    content = np.zeros((OUT_H, OUT_W, 3), np.float32)
    for fr, st in zip(fr_s, STEPS):
        step = st if with_text else dict(st, lines=['', ''], num='')
        place_content(content, panel_for(fr, step), fr)
    return finish(compose(P, A, content))


def render_photos(P, A, fr_s):
    content = np.zeros((OUT_H, OUT_W, 3), np.float32)
    place_content(content, photo_for(fr_s[0], STATIC_LEFT, 1.02), fr_s[0])
    place_content(content, TapButton(fr_s[1]).frame(0.62), fr_s[1])     # main au repos, ondes visibles
    place_content(content, photo_for(fr_s[2], STATIC_RIGHT, 1.02), fr_s[2])
    return finish(compose(P, A, content), 0.35)


def slot_state(t, keys, offset):
    """Photos visibles dans un cadre à l'instant t : [(clé, zoom, opacité, panoramique)], dessous -> dessus."""
    n = len(keys)
    L = n * SHOW
    u = (t - offset) % L
    i = int(u // SHOW)
    loc = u - i * SHOW

    def motion(j, k_loc):      # k_loc : temps depuis le début du fondu d'entrée de la photo j
        p = min(1.0, max(0.0, k_loc / (SHOW + FADE)))
        p = p * p * (3 - 2 * p) * 0.4 + p * 0.6
        z = 1.0 + 0.08 * p if j % 2 == 0 else 1.08 - 0.08 * p
        pan = (p - 0.5) * (1 if (j // 2) % 2 == 0 else -1)
        return z, pan

    z, pan = motion(i, loc + FADE)
    out = [(keys[i], z, 1.0, pan)]
    if loc >= SHOW - FADE:
        a = (loc - (SHOW - FADE)) / FADE
        a = a * a * (3 - 2 * a)
        j = (i + 1) % n
        z2, pan2 = motion(j, loc - (SHOW - FADE))
        out.append((keys[j], z2, a, pan2))
    return out


def render_anim(P, A, fr_s, out_path, seconds=None):
    L = len(ANIM_LEFT) * SHOW
    seconds = seconds or L
    nframes = int(round(seconds * FPS))
    tap = TapButton(fr_s[1])
    sparks = sparkle_points(P, A, fr_s)
    sprites = {}
    tm = title_mask(P, A)
    ys, xs = np.nonzero(tm > 0.2)
    tx0, tx1 = xs.min(), xs.max()
    xx = np.arange(OUT_W, dtype=np.float32)[None, :]
    yy = np.arange(OUT_H, dtype=np.float32)[:, None]
    wms = [window_mask(fr, (OUT_H, OUT_W)) for fr in fr_s]
    # paillettes : surtout sur le fond, très discrètes sur les photos et le bouton
    win_all = np.maximum.reduce([window_mask(fr, (OUT_H, OUT_W), grow=20) for fr in fr_s])
    pmask = 1 - 0.85 * cv2.GaussianBlur(win_all, (0, 0), 12)
    parts = make_particles(loop=L)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT_W}x{OUT_H}',
           '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
           '-profile:v', 'high', '-movflags', '+faststart', out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k in range(nframes):
        t = k / FPS
        content = np.zeros((OUT_H, OUT_W, 3), np.float32)
        place_content(content, tap.frame(t), fr_s[1])
        for fr, keys, off in ((fr_s[0], ANIM_LEFT, 0.0), (fr_s[2], ANIM_RIGHT, -SHOW / 2)):
            place_content(content, wipe_slot(fr, slot_state(t, keys, off)), fr)
        out = compose(P, A, content)
        # reflet lumineux qui balaie le titre toutes les 7 s
        ph = (t % 7.0) / 1.6
        if ph < 1.0:
            xc = tx0 - 200 + ph * (tx1 - tx0 + 400)
            band = np.exp(-((xx - xc + (yy - OUT_H * 0.8) * 0.35) / 70.0) ** 2)
            out = out + (np.array([255, 245, 215], np.float32) - out) * (0.55 * band * tm)[..., None]
        draw_particles(out, parts, t, pmask, loop=L)
        # scintillements sur les confettis du décor
        for sp in sparks:
            v = 0.5 - 0.5 * math.cos(2 * math.pi * (t / sp['period'] + sp['phase']))
            v = v ** 4
            if v < 0.02:
                continue
            key = round(sp['size'])
            if key not in sprites:
                sprites[key] = star_sprite(sp['size'])
            s_ = sprites[key]
            r = s_.shape[0] // 2
            x, y = int(sp['x']), int(sp['y'])
            if r <= x < OUT_W - r and r <= y < OUT_H - r:
                reg = out[y - r:y + r + 1, x - r:x + r + 1]
                out[y - r:y + r + 1, x - r:x + r + 1] = reg + (np.array([255, 240, 200], np.float32) - reg) * (s_ * v)[..., None]
        frame = finish(out, 0.35)
        proc.stdin.write(np.asarray(frame).tobytes())
        if k == 0:
            frame.save(out_path.replace('.mp4', '_apercu.jpg'), quality=92)
    proc.stdin.close()
    proc.wait()
    return nframes


if __name__ == '__main__':
    os.makedirs('out', exist_ok=True)
    what = sys.argv[1:] or ['etapes', 'photos', 'anime']
    P2, A2, frames = build_layers()
    P = to_screen(P2, darken=True)
    A = to_screen(A2)
    fr_s = [frame_on_screen(f) for f in frames]
    print('cadres a l ecran', [{k: round(v, 1) for k, v in f.items()} for f in fr_s], 'geometrie', screen_geometry())
    if 'etapes' in what:
        im = render_steps(P, A, fr_s)
        im.save('out/accueil_1920x1080.png', optimize=True)
        im.save('out/accueil_1920x1080.jpg', quality=95)
        render_steps(P, A, fr_s, with_text=False).save('out/accueil_1920x1080_sans_texte.png', optimize=True)
    if 'photos' in what:
        im = render_photos(P, A, fr_s)
        im.save('out/accueil_photos_1920x1080.png', optimize=True)
        im.save('out/accueil_photos_1920x1080.jpg', quality=95)
    if 'anime' in what:
        n = render_anim(P, A, fr_s, 'out/accueil_anime_1920x1080.mp4')
        print('video', n, 'images')
    print('ok')
