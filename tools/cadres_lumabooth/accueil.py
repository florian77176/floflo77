"""Page d'accueil (écran de démarrage) LumaBooth, 1920x1080, tirée du modèle 3 photos paysage.

Les trois cadres (redessinés réguliers comme pour l'impression) deviennent trois étapes :
1 « Touchez l'écran pour commencer », 2 « Prenez la pose », 3 « Découvrez votre photo ».
Le titre, les verres, le ballon transparent et le reste du décor d'origine sont conservés.

Usage (depuis le dossier de travail src/ base/ x4/ out/ fonts/) : python3 accueil.py
Polices (Google Fonts, licence OFL) : Cinzel, Cormorant Garamond ; icônes : Material Icons (Apache 2.0).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *  # noqa
from keying import refine_quad, offset_quad
from regulier import border_strips, draw_frames
from fidele import SPECS, place, front_mask, old_overlay
from PIL import ImageDraw, ImageFont

K = 2                      # travail en 2x (3600x2400) puis réduction : rendu net
CROP = (75, 1125)          # bande gardée (coordonnées 1200) : du dessus des cadres à sous la date
OUT_SIZE = (1920, 1080)
FONTS = os.path.join(os.getcwd(), 'fonts')
GOLD = [(252, 236, 186), (240, 205, 128), (205, 150, 62), (246, 216, 140)]   # dégradé doré (haut -> bas)
ICONS = {'touch_app': 0xE913, 'photo_camera': 0xE412, 'photo_library': 0xE413}

STEPS = [
    dict(num='1', icon='touch_app', lines=["Touchez l'écran", 'pour commencer']),
    dict(num='2', icon='photo_camera', lines=['Prenez la pose', 'et souriez !']),
    dict(num='3', icon='photo_library', lines=['Découvrez', 'votre photo']),
]


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight:
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
    return f


def gold_layer(mask):
    """Remplit un masque (0..1) d'un dégradé doré vertical calé sur la hauteur du tracé, avec ombre douce."""
    H, W = mask.shape
    ys = np.nonzero(mask.max(axis=1) > 0.05)[0]
    y0, y1 = (ys[0], ys[-1]) if len(ys) else (0, H - 1)
    t = np.clip((np.arange(H) - y0) / max(1, y1 - y0), 0, 1)
    stops = np.linspace(0, 1, len(GOLD))
    col = np.stack([np.interp(t, stops, [c[k] for c in GOLD]) for k in range(3)], -1)[:, None, :]
    col = np.broadcast_to(col, (H, W, 3)).astype(np.float32)
    # léger relief : bord haut plus clair
    hl = np.clip(mask - np.roll(mask, 2, axis=0), 0, 1)[..., None]
    col = np.clip(col + 40 * hl, 0, 255)
    return col


def draw_text_mask(size, items):
    """items : (texte, police, (cx, cy)). Renvoie un masque float 0..1."""
    im = Image.new('L', size, 0)
    d = ImageDraw.Draw(im)
    for txt, f, (cx, cy) in items:
        d.text((cx, cy), txt, font=f, fill=255, anchor='mm')
    return np.asarray(im, np.float32) / 255


def panel_image(w, h, step):
    """Contenu d'une fenêtre (bleu nuit + numéro, icône, texte dorés), taille w x h."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h * 0.45) / (h * 0.75)) ** 2)
    c0, c1 = np.array([30, 52, 98], np.float32), np.array([9, 20, 46], np.float32)
    base = c0 * (1 - np.clip(r, 0, 1))[..., None] + c1 * np.clip(r, 0, 1)[..., None]
    rng = np.random.default_rng(len(step['icon']))
    base += rng.normal(0, 1.6, (h, w, 1)).astype(np.float32)          # grain léger
    # paillettes dorées discrètes
    sp = np.zeros((h, w), np.float32)
    for _ in range(int(w * h / 9000)):
        x, y = rng.integers(0, w), rng.integers(0, h)
        rad = rng.uniform(1.2, 3.2) * K / 2
        cv2.circle(sp, (int(x), int(y)), max(1, int(rad)), float(rng.uniform(0.25, 0.7)), -1, cv2.LINE_AA)
    sp = cv2.GaussianBlur(sp, (0, 0), 0.8)
    img = base * (1 - sp[..., None]) + np.array([235, 196, 120], np.float32) * sp[..., None]
    # contenu
    s = h / 1140.0                                       # échelle (fenêtre de référence 1060x1140 en 2x)
    f_num = font('Cinzel.ttf', int(150 * s), 'Bold')
    f_ico = ImageFont.truetype(os.path.join(FONTS, 'MaterialIcons.ttf'), int(330 * s))
    f_l1 = font('Cormorant.ttf', int(118 * s), 'SemiBold')
    f_l2 = font('CormorantItalic.ttf', int(92 * s), 'Medium')
    items = [(step['num'], f_num, (w / 2, h * 0.14)),
             (chr(ICONS[step['icon']]), f_ico, (w / 2, h * 0.41)),
             (step['lines'][0], f_l1, (w / 2, h * 0.66)),
             (step['lines'][1], f_l2, (w / 2, h * 0.765))]
    if not step['num']:   # version sans texte : icône seule, centrée et plus grande
        f_big = ImageFont.truetype(os.path.join(FONTS, 'MaterialIcons.ttf'), int(440 * s))
        items = [(chr(ICONS[step['icon']]), f_big, (w / 2, h * 0.5))]
    m = draw_text_mask((w, h), items)
    if step['num']:       # fine ligne dorée sous le numéro
        line = np.zeros((h, w), np.float32)
        cv2.line(line, (int(w * 0.40), int(h * 0.225)), (int(w * 0.60), int(h * 0.225)), 1.0, max(1, int(3 * s)), cv2.LINE_AA)
        m = np.maximum(m, line)
    shadow = cv2.GaussianBlur(m, (0, 0), 6 * s)
    shadow = np.roll(np.roll(shadow, int(5 * s), 0), int(3 * s), 1)
    img = img * (1 - 0.65 * shadow[..., None])
    glow = cv2.GaussianBlur(m, (0, 0), 14 * s)
    img = img + np.array([60, 45, 15], np.float32) * glow[..., None] * 0.6
    img = img * (1 - m[..., None]) + gold_layer(m) * m[..., None]
    return np.clip(img, 0, 255)


def build(with_text=True):
    W1, H1 = 1800, 1200
    W, H = W1 * K, H1 * K
    hi = os.path.join(os.getcwd(), 'x4', '3photos.png')
    rgb = np.array(Image.open(hi).convert('RGB').resize((W, H), Image.LANCZOS))
    base1 = base_image('3photos', (W1, H1))
    quads1 = [refine_quad(base1, b)[0] for b in white_windows(base1)]
    quads = [q * K for q in quads1]
    # fond sans l'ancienne dorure
    hole = np.zeros((H, W), np.uint8)
    for q in quads:
        cv2.fillPoly(hole, [np.round(offset_quad(q, 17 * K)).astype(np.int32)], 255)
    bg = cv2.inpaint(rgb, cv2.dilate(hole, np.ones((5, 5), np.uint8)), 7, cv2.INPAINT_TELEA)
    # cadres réguliers (mêmes réglages que le modèle imprimé)
    frames = []
    for q1, f in zip(quads1, SPECS['3photos']['frames']):
        cx, cy = place(q1, f)
        frames.append(dict(cx=cx * K, cy=cy * K, w=f['w'] * K, h=f['h'] * K, angle=f['angle'], border=15 * K))
    strips = [border_strips(rgb, q, rows=(K, 16 * K), trim_rows=True) for q in quads]
    order = [0, 1, 2]
    rf = draw_frames(bg, frames, strips, order, shadow=False)
    P = rf[..., :3] * rf[..., 3:4]
    A = rf[..., 3].copy()
    # contenu des fenêtres (sous les cadres)
    content = np.zeros((H, W, 3), np.float32)
    for fr, st in zip(frames, STEPS):
        pw, ph = int(fr['w']) + 40, int(fr['h']) + 40
        pan = panel_image(pw, ph, st if with_text else dict(st, lines=['', ''], num='', icon=st['icon']))
        M = cv2.getRotationMatrix2D((pw / 2, ph / 2), -fr['angle'], 1.0)
        M[0, 2] += fr['cx'] - pw / 2
        M[1, 2] += fr['cy'] - ph / 2
        warped = cv2.warpAffine(pan, M, (W, H), flags=cv2.INTER_CUBIC)
        mk = cv2.warpAffine(np.ones((ph, pw), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
        content = content * (1 - mk[..., None]) + warped * mk[..., None]
    P = P + content * (1 - A)[..., None]
    out = np.clip(P, 0, 255)
    # décors posés devant (verres, ballon transparent) : rendu détouré d'origine, agrandi
    fm1 = front_mask('3photos', (H1, W1))
    oc, oa = old_overlay('3photos', base1)
    fm = cv2.resize(fm1, (W, H), interpolation=cv2.INTER_LINEAR)
    oc2 = cv2.resize(oc, (W, H), interpolation=cv2.INTER_CUBIC)
    oa2 = cv2.resize(oa, (W, H), interpolation=cv2.INTER_LINEAR)
    # couleur nette (image 2x) là où le décor est opaque, rendu détouré là où il est translucide
    deco = np.where((oa2 > 0.98)[..., None], rgb.astype(np.float32), oc2)
    m = fm[..., None]
    out = out * (1 - m) + (deco * oa2[..., None] + out * (1 - oa2[..., None])) * m
    # recadrage 16:9 puis réduction
    y0, y1 = CROP[0] * K, CROP[1] * K
    final = Image.fromarray(np.clip(np.round(out[y0:y1]), 0, 255).astype(np.uint8)).resize(OUT_SIZE, Image.LANCZOS)
    arr = np.asarray(final).astype(np.float32)
    sharp = np.clip(arr + 0.5 * (arr - cv2.GaussianBlur(arr, (0, 0), 0.9)), 0, 255)
    return Image.fromarray(np.round(sharp).astype(np.uint8))


if __name__ == '__main__':
    os.makedirs('out', exist_ok=True)
    im = build(with_text=True)
    im.save('out/accueil_1920x1080.png', optimize=True)
    im.save('out/accueil_1920x1080.jpg', quality=95)
    im2 = build(with_text=False)
    im2.save('out/accueil_1920x1080_sans_texte.png', optimize=True)
    print('ok', im.size)
