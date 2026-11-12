"""Cadres photo RÉGULIERS : les fenêtres dessinées par l'IA (côtés et angles inégaux) sont remplacées par de
vrais rectangles identiques (taille et angle ronds), avec la texture dorée d'origine.

Étapes pour chaque modèle :
  1. on retire les anciens cadres du fond (inpainting ; petits décors collés retirés en entier) ;
  2. on redessine chaque cadre : ombre portée, bordure dorée (bandes de texture prélevées sur l'ancien cadre,
     coins en onglet), fenêtre transparente exacte ;
  3. les décors posés DEVANT (verres, ballon, ruban) sont recollés par-dessus ;
  4. cases photo LumaBooth = fenêtre + débord sous la bordure, mêmes centre et angle.

Usage (depuis le dossier de travail src/ base/ x4/ out/) : python3 regulier.py [noms…]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *  # noqa
from keying import refine_quad, offset_quad, key_windows

BORDER = 15      # largeur de la dorure (px à 300 dpi)
BLEED = 10       # débord de la photo sous la dorure
SHADOW = dict(dx=-7, dy=9, sigma=9, opacity=0.72)


# ---------------------------------------------------------------- texture dorée prélevée sur l'ancien cadre
def border_strips(rgb, quad, rows=(1, BORDER + 1)):
    """Bandes de dorure de chaque côté (haut, droite, bas, gauche) : tableau (profondeur, longueur, 3),
    ligne 0 = bord intérieur. Seule la partie centrale (sans les coins en onglet) est gardée."""
    cen = quad.mean(0)
    strips = []
    for i in range(4):
        p, q = quad[i], quad[(i + 1) % 4]
        L = np.linalg.norm(q - p)
        u = (q - p) / L
        n = np.array([-u[1], u[0]])
        if np.dot((p + q) / 2 - cen, n) < 0:
            n = -n
        ts = np.arange(0.1 * L, 0.9 * L, 1.0)
        ds = np.arange(rows[0], rows[1], 1.0)
        T, D = np.meshgrid(ts, ds)
        X = (p[0] + T * u[0] + D * n[0]).astype(np.float32)
        Y = (p[1] + T * u[1] + D * n[1]).astype(np.float32)
        st = cv2.remap(rgb, X, Y, cv2.INTER_LINEAR).astype(np.float32)
        # on ne garde que la plus longue portion vraiment dorée (un autre cadre ou un décor peut cacher le côté)
        mx = st.max(axis=2)
        sat = (mx - st.min(axis=2)) / np.maximum(mx, 1)
        goldpx = (sat > 0.2) & (mx > 120)
        ok = cv2.blur(goldpx.mean(axis=0).astype(np.float32).reshape(1, -1), (9, 1)).ravel() > 0.45
        best, cur, start, bstart = 0, 0, 0, 0
        for k, o in enumerate(ok):
            if o:
                if cur == 0:
                    start = k
                cur += 1
                if cur > best:
                    best, bstart = cur, start
            else:
                cur = 0
        if best >= 60:
            st = st[:, bstart:bstart + best]
        strips.append(st)
    return strips  # ordre : haut, droite, bas, gauche


def fit_strip(strip, length):
    """Adapte une bande à la longueur voulue : étirement léger, sinon miroir raccordé en fondu puis étirement."""
    Lh = strip.shape[1]
    s = strip
    while s.shape[1] * 1.25 < length:
        f = s[:, ::-1]
        ov = min(40, s.shape[1] // 4)
        w = np.linspace(0, 1, ov)[None, :, None]
        mid = s[:, -ov:] * (1 - w) + f[:, :ov] * w
        s = np.concatenate([s[:, :-ov], mid, f[:, ov:]], 1)
    return cv2.resize(s, (int(length), s.shape[0]), interpolation=cv2.INTER_LINEAR if length > Lh else cv2.INTER_AREA)


# ---------------------------------------------------------------- géométrie d'un cadre
def frame_maps(shape, cx, cy, w, h, ang, B=BORDER):
    """Coordonnées locales (u, v) du rectangle (fenêtre de 0..w, 0..h), couvertures anti-crénelées."""
    H, W = shape
    th = math.radians(ang)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx, dy = xx - cx, yy - cy
    c, s = math.cos(th), math.sin(th)
    u = dx * c + dy * s + w / 2      # repère du rectangle (rotation inverse)
    v = -dx * s + dy * c + h / 2
    def box_cov(x0, y0, x1, y1):
        return (np.clip(np.minimum(u - x0, x1 - u) + 0.5, 0, 1) * np.clip(np.minimum(v - y0, y1 - v) + 0.5, 0, 1))
    win = box_cov(0, 0, w, h)
    outer = box_cov(-B, -B, w + B, h + B)
    return u, v, win, outer


def draw_frames(bg, frames, strips_by_frame, order, shadow=True):
    """Dessine les cadres (du dessous vers le dessus). Renvoie RGBA float (couleur non prémultipliée, alpha 0..1)."""
    H, W, _ = bg.shape
    P = bg.astype(np.float32)          # couleur prémultipliée
    A = np.ones((H, W), np.float32)
    for i in order:
        fr = frames[i]
        cx, cy, w, h, ang = fr['cx'], fr['cy'], fr['w'], fr['h'], fr['angle']
        u, v, win, outer = frame_maps((H, W), cx, cy, w, h, ang)
        # ombre portée (noir, floutée, décalée) sur ce qui est dessous
        sh = cv2.GaussianBlur(outer, (0, 0), SHADOW['sigma'])
        Ms = np.float32([[1, 0, SHADOW['dx']], [0, 1, SHADOW['dy']]])
        sh = cv2.warpAffine(sh, Ms, (W, H)) * SHADOW['opacity'] * (1 - outer) * (1.0 if shadow else 0.0)
        P = P * (1 - sh)[..., None]
        A = A + sh * (1 - A)
        # dorure : côté le plus proche (coins en onglet), profondeur d et position s le long du côté
        B = BORDER
        dt, dr, db, dl = -v, u - w, v - h, -u            # distance vers l'extérieur de chaque côté
        side = np.argmax(np.stack([dt, dr, db, dl]), 0)
        col = np.zeros((H, W, 3), np.float32)
        lengths = [w + 2 * B, h + 2 * B, w + 2 * B, h + 2 * B]
        pos = [u + B, v + B, (w + B) - u, (h + B) - v]   # sens de parcours : haut →, droite ↓, bas ←, gauche ↑
        depth = [dt, dr, db, dl]
        band = (outer > 0) & (win < 1)
        for k in range(4):
            sel = band & (side == k)
            if not sel.any():
                continue
            st = fit_strip(strips_by_frame[i][k], lengths[k])
            d = np.clip(depth[k][sel], 0, B - 0.51)
            sp = np.clip(pos[k][sel], 0, st.shape[1] - 1.01)
            mx = sp.astype(np.float32).reshape(-1, 1)
            my = d.astype(np.float32).reshape(-1, 1)
            col[sel] = cv2.remap(st, mx, my, cv2.INTER_LINEAR).reshape(-1, 3)
        bfrac = np.clip(outer - win, 0, 1)                  # part de dorure dans le pixel
        P = (1 - outer)[..., None] * P + bfrac[..., None] * col
        A = (1 - outer) * A + bfrac
    C = P / np.maximum(A, 1e-4)[..., None]
    return np.dstack([np.clip(C, 0, 255), A])


# ---------------------------------------------------------------- fond sans les anciens cadres
def remove_old_frames(rgb, quads, keep=None, ring=44):
    """Retire les anciens cadres (bordure + ombre). keep : masque de décors à ne pas effacer."""
    H, W, _ = rgb.shape
    hole = np.zeros((H, W), np.uint8)
    o16 = np.zeros((H, W), np.uint8)
    for q in quads:
        cv2.fillPoly(hole, [np.round(offset_quad(q, ring)).astype(np.int32)], 1)
        cv2.fillPoly(o16, [np.round(offset_quad(q, 17)).astype(np.int32)], 1)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    deco = ((hsv[..., 0] >= 8) & (hsv[..., 0] <= 35) & (hsv[..., 1] > 70) & (hsv[..., 2] > 100)) | (hsv[..., 2] > 200)
    deco = cv2.dilate(deco.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & (o16 == 0)
    n, lab, st, _ = cv2.connectedComponentsWithStats(deco.astype(np.uint8))
    touch = np.unique(lab[(hole > 0) & (o16 == 0)])
    for i in touch:
        if not i:
            continue
        comp = lab == i
        if st[i, 4] < 1500:     # perle, étoile, confetti : retiré en entier
            hole[cv2.dilate(comp.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0] = 1
        else:                   # grand décor (pinceau, ruban) : conservé
            hole[comp] = 0
    if keep is not None:
        hole[keep] = 0
    hole = cv2.dilate(hole, np.ones((3, 3), np.uint8))
    if keep is not None:
        hole[keep] = 0
    return cv2.inpaint(rgb, hole * 255, 5, cv2.INPAINT_TELEA), hole.astype(bool)


# ---------------------------------------------------------------- modèles
# fenêtres : (centre x, centre y, largeur, hauteur, angle). Format 2:3 / 3:2 = celui d'un reflex.
SPECS = {
    '1photo': dict(size=(1200, 1800), title='Jordan 30 ans - 1 photo',
                   frames=[(600, 572, 640, 960, -5)]),
    '2photos': dict(size=(1200, 1800), title='Jordan 30 ans - 2 photos',
                    frames=[(336, 560, 480, 720, -5), (864, 560, 480, 720, 5)], order=[1, 0]),
    '3photos': dict(size=(1800, 1200), title='Jordan 30 ans - 3 photos paysage',
                    frames=[(303, 455, 400, 600, -5), (900, 366, 400, 600, 0), (1497, 455, 400, 600, 5)]),
    '3photos_creme': dict(size=(1200, 1800), title='Jordan 30 ans - 3 photos (creme)', src='exemple3photos',
                          frames=[(314, 303, 540, 434, 0), (888, 303, 540, 434, 0), (600, 811, 1048, 514, 0)],
                          inpaint=False, shadow=False),
}


def old_quads(name, rgb):
    if name == '3photos_creme':
        import run_exemple as RE
        return [RE.quad_from_border(rgb, b)[0] for b in RE.APPROX.values()]
    return [refine_quad(rgb, b)[0] for b in white_windows(rgb)]


def keep_mask(name, rgb):
    """Décors à ne pas effacer avec les anciens cadres."""
    if name == '3photos_creme':
        import run_exemple as RE
        return RE.decor_keep(rgb, None) > 0.5   # ruban doré (sans le creux de la boucle)
    return None


def build_regular(name, photos=None):
    from run_white import sample_photos
    spec = SPECS[name]
    W, H = spec['size']
    rgb = base_image(spec.get('src', name), (W, H))
    quads = old_quads(name, rgb)
    if spec.get('inpaint', True):
        bg, hole = remove_old_frames(rgb, quads, keep=keep_mask(name, rgb))
    else:  # les nouveaux cadres recouvrent entièrement les anciens : fond d'origine intact
        bg = rgb.copy()
    frames = [dict(cx=f[0], cy=f[1], w=f[2], h=f[3], angle=f[4]) for f in spec['frames']]
    # texture : chaque nouveau cadre prend la dorure de l'ancien cadre le plus proche
    strips = []
    for fr in frames:
        k = int(np.argmin([np.hypot(*(q.mean(0) - [fr['cx'], fr['cy']])) for q in quads]))
        strips.append(border_strips(rgb, quads[k]))
    order = spec.get('order', list(range(len(frames))))
    rgba_f = draw_frames(bg, frames, strips, order, shadow=spec.get('shadow', True))
    rgba = np.dstack([np.round(rgba_f[..., :3]).astype(np.uint8), np.round(rgba_f[..., 3] * 255).astype(np.uint8)])
    rects = [dict(cx=f['cx'], cy=f['cy'], w=f['w'] + 2 * BLEED, h=f['h'] + 2 * BLEED, ang=float(f['angle']))
             for f in frames]
    write_template(f'Jordan30_{name}', spec['title'], rgba, rects, W, H, order=order)
    photos = photos or sample_photos()
    render_preview(rgba, rects, photos, order=order).save(f'out/apercu_{name}.jpg', quality=92)
    render_preview(rgba, rects, photos, with_boxes=True, order=order).save(f'out/controle_{name}.png')
    return rgba, rects, frames


if __name__ == '__main__':
    for nm in sys.argv[1:] or list(SPECS):
        rgba, rects, frames = build_regular(nm)
        print(nm, [(to_xml_rect(r, *SPECS[nm]['size'])) for r in rects])
