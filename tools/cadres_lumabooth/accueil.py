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
    'p01': (600, 720, 1040), 'p02': (660, 880, 1120), 'p03': (680, 700, 1150), 'p04': (650, 690, 1200),
    'p05': (790, 800, 820), 'p06': (640, 800, 1100), 'p07': (650, 760, 1100), 'p08': (660, 640, 1000),
    'p09': (720, 620, 1000), 'p10': (650, 520, 760),
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


def panel_image(w, h, step, glow_gain=0.6):
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
        items = [(chr(ICONS[step['icon']]), f_ico(400), (w / 2, h * 0.37)),
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


def photo_view(key, w, h, zoom=1.0):
    """Cadrage w x h d'une photo de Jordan, centré sur le visage, zoom >= 1 (effet Ken Burns)."""
    if key not in _PHOTO_CACHE:
        _PHOTO_CACHE[key] = np.array(Image.open(os.path.join(os.getcwd(), 'jordan', f'{key}.jpg')).convert('RGB')).astype(np.float32)
    src = _PHOTO_CACHE[key]
    cx, cy, ch = PHOTOS[key]
    ch = ch / zoom
    cw = ch * w / h
    # on garde le cadrage dans l'image
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


def photo_for(fr, key, zoom=1.0, extra=12):
    pw, ph = int(round(fr['w'])) + 2 * extra, int(round(fr['h'])) + 2 * extra
    return photo_view(key, pw, ph, zoom)


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


# ---------------------------------------------------------------- sorties
def render_steps(P, A, fr_s, with_text=True):
    content = np.zeros((OUT_H, OUT_W, 3), np.float32)
    for fr, st in zip(fr_s, STEPS):
        step = st if with_text else dict(st, lines=['', ''], num='')
        place_content(content, panel_for(fr, step), fr)
    return finish(compose(P, A, content))


def render_photos(P, A, fr_s):
    content = np.zeros((OUT_H, OUT_W, 3), np.float32)
    place_content(content, photo_for(fr_s[0], STATIC_LEFT), fr_s[0])
    place_content(content, panel_for(fr_s[1], CTA), fr_s[1])
    place_content(content, photo_for(fr_s[2], STATIC_RIGHT), fr_s[2])
    return finish(compose(P, A, content), 0.35)


def slot_state(t, keys, offset):
    """Photos visibles dans un cadre à l'instant t : [(clé, zoom, opacité)], du dessous vers le dessus."""
    n = len(keys)
    L = n * SHOW
    u = (t - offset) % L
    i = int(u // SHOW)
    loc = u - i * SHOW
    def zoom(k_loc):      # k_loc : temps depuis le début du fondu d'entrée de la photo
        return 1.0 + 0.07 * min(1.0, max(0.0, k_loc / (SHOW + FADE)))
    cur = (keys[i], zoom(loc + FADE), 1.0)
    if loc >= SHOW - FADE:     # fondu vers la suivante
        a = (loc - (SHOW - FADE)) / FADE
        a = a * a * (3 - 2 * a)
        nxt = (keys[(i + 1) % n], zoom(loc - (SHOW - FADE)), a)
        return [cur, nxt]
    return [cur]


def render_anim(P, A, fr_s, out_path, seconds=None):
    L = len(ANIM_LEFT) * SHOW
    seconds = seconds or L
    nframes = int(round(seconds * FPS))
    # panneau central : deux intensités de halo, mélangées en pulsation (période 2,5 s)
    pan_lo = panel_for(fr_s[1], CTA, glow_gain=0.4)
    pan_hi = panel_for(fr_s[1], CTA, glow_gain=1.6)
    base_center = np.zeros((OUT_H, OUT_W, 3), np.float32)
    sparks = sparkle_points(P, A, fr_s)
    sprites = {}
    tm = title_mask(P, A)
    ys, xs = np.nonzero(tm > 0.2)
    tx0, tx1 = xs.min(), xs.max()
    xx = np.arange(OUT_W, dtype=np.float32)[None, :]
    yy = np.arange(OUT_H, dtype=np.float32)[:, None]
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT_W}x{OUT_H}',
           '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
           '-profile:v', 'high', '-movflags', '+faststart', out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k in range(nframes):
        t = k / FPS
        content = base_center.copy()
        g = 0.5 - 0.5 * math.cos(2 * math.pi * t / 2.5)
        place_content(content, pan_lo * (1 - g) + pan_hi * g, fr_s[1])
        for fr, keys, off in ((fr_s[0], ANIM_LEFT, 0.0), (fr_s[2], ANIM_RIGHT, -SHOW / 2)):
            for key, z, a in slot_state(t, keys, off):
                place_content(content, photo_for(fr, key, z), fr, alpha=a)
        out = compose(P, A, content)
        # reflet lumineux qui balaie le titre toutes les 7 s
        ph = (t % 7.0) / 1.6
        if ph < 1.0:
            xc = tx0 - 200 + ph * (tx1 - tx0 + 400)
            band = np.exp(-((xx - xc + (yy - OUT_H * 0.8) * 0.35) / 70.0) ** 2)
            out = out + (np.array([255, 245, 215], np.float32) - out) * (0.55 * band * tm)[..., None]
        # scintillements
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
