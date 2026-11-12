"""Cadres FIDÈLES à l'original, rendus réguliers : chaque cadre dessiné par l'IA (côtés et angles inégaux) est
remplacé par un vrai rectangle aux valeurs rondes (taille commune, angle rond) posé au même endroit.

- 1 photo et 3 photos : les cadres restent où ils sont ; la dorure est redessinée (texture d'origine) ;
  l'ombre portée d'origine est conservée ; les décors posés devant (verres, ballons) sont recollés par-dessus.
- 2 photos : les cadres étaient à 1 mm du bord du papier (rognés à l'impression) ; ils sont rapprochés du
  centre en déformant doucement le fond (étirement entre le bord et le cadre), les petits décors (perles,
  étoiles) gardant leur forme.

Usage (depuis le dossier de travail src/ base/ x4/ out/) : python3 fidele.py [1photo 2photos 3photos]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *  # noqa
from keying import refine_quad, offset_quad, key_windows
from regulier import border_strips, draw_frames, BLEED

# angle, largeur, hauteur de la fenêtre visible ; ancrage : 'center' (centre de l'ancien cadre) ou coin
# de l'ancien cadre à garder en place ('BL' bas-gauche, 'BR' bas-droite) ; shift : déplacement (px)
SPECS = {
    '1photo': dict(size=(1200, 1800), title='Jordan 30 ans - 1 photo',
                   frames=[dict(angle=-6, w=730, h=860, anchor='center')]),
    '2photos': dict(size=(1200, 1800), title='Jordan 30 ans - 2 photos', order=[1, 0],
                    frames=[dict(angle=-8, w=500, h=720, anchor='center', shift=(26, 0)),
                            dict(angle=7, w=500, h=720, anchor='center', shift=(-30, 0))]),
    '3photos': dict(size=(1800, 1200), title='Jordan 30 ans - 3 photos paysage',
                    frames=[dict(angle=-7, w=510, h=550, anchor='BL'),
                            dict(angle=0, w=510, h=550, anchor='center'),
                            dict(angle=7, w=510, h=550, anchor='BR')]),
}


def rect_corners(cx, cy, w, h, ang):
    th = math.radians(ang)
    u = np.array([math.cos(th), math.sin(th)])
    v = np.array([-math.sin(th), math.cos(th)])
    c = np.array([cx, cy], float)
    return np.array([c - w / 2 * u - h / 2 * v, c + w / 2 * u - h / 2 * v, c + w / 2 * u + h / 2 * v, c - w / 2 * u + h / 2 * v])


def place(q, f):
    """Centre du nouveau rectangle selon l'ancrage choisi."""
    th = math.radians(f['angle'])
    u = np.array([math.cos(th), math.sin(th)])
    v = np.array([-math.sin(th), math.cos(th)])
    if f['anchor'] == 'center':
        c = q.mean(0)
    elif f['anchor'] == 'BL':
        c = q[3] + f['w'] / 2 * u - f['h'] / 2 * v
    elif f['anchor'] == 'BR':
        c = q[2] - f['w'] / 2 * u - f['h'] / 2 * v
    sx, sy = f.get('shift', (0, 0))
    return float(round(c[0] + sx)), float(round(c[1] + sy))


# ---------------------------------------------------------------- déformation douce du fond (2 photos)
def smooth_shift(rgb, quads, shifts, protect, step=6, ring=40, edge_keep=8):
    """Déplace chaque cadre (et son ombre) de shifts[i] ; le fond entre les cadres et les bords du papier
    s'étire/se resserre en douceur (champ harmonique), bords du papier et zones protégées immobiles.
    Les petits décors (perles, étoiles, confettis) sont déplacés sans être déformés."""
    import scipy.sparse as sp
    import scipy.sparse.linalg as spla
    H, W, _ = rgb.shape
    gh, gw = H // step + 1, W // step + 1
    fixed = np.zeros((gh, gw), bool)
    val = np.zeros((gh, gw, 2), np.float64)
    gy, gx = np.mgrid[0:gh, 0:gw]
    px, py = gx * step, gy * step
    for q, t in zip(quads, shifts):
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.round(offset_quad(q, ring)).astype(np.int32)], 1)
        m[:, :edge_keep] = 0
        m[:, W - edge_keep:] = 0
        mg = m[np.clip(py, 0, H - 1), np.clip(px, 0, W - 1)].astype(bool)
        fixed |= mg
        val[mg] = t
    edge = (gx == 0) | (gx == gw - 1)
    pg = protect[np.clip(py, 0, H - 1), np.clip(px, 0, W - 1)] | edge
    pg &= ~fixed
    fixed |= pg
    val[pg] = 0
    # Laplace : inconnues = nœuds libres ; bords haut/bas libres (Neumann)
    idx = -np.ones((gh, gw), int)
    free = ~fixed
    idx[free] = np.arange(free.sum())
    n = free.sum()
    rows, cols, data = [], [], []
    b = np.zeros((n, 2))
    fy, fx = np.nonzero(free)
    for k, (y, x) in enumerate(zip(fy, fx)):
        nb = [(y + dy, x + dx) for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)) if 0 <= y + dy < gh and 0 <= x + dx < gw]
        rows.append(k); cols.append(k); data.append(len(nb))
        for yy, xx in nb:
            if free[yy, xx]:
                rows.append(k); cols.append(idx[yy, xx]); data.append(-1)
            else:
                b[k] += val[yy, xx]
    A = sp.csr_matrix((data, (rows, cols)), shape=(n, n))
    sol = np.stack([spla.spsolve(A, b[:, 0]), spla.spsolve(A, b[:, 1])], 1)
    Dg = val.copy()
    Dg[free] = sol
    D = np.stack([cv2.resize(Dg[..., k].astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) for k in range(2)], -1)
    # petits décors : retirés avant la déformation, recollés tels quels à leur nouvelle place
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    deco = ((hsv[..., 0] >= 8) & (hsv[..., 0] <= 35) & (hsv[..., 1] > 70) & (hsv[..., 2] > 100)) | (hsv[..., 2] > 200)
    deco = cv2.dilate(deco.astype(np.uint8), np.ones((5, 5), np.uint8))
    frames_m = np.zeros((H, W), np.uint8)
    for q in quads:
        cv2.fillPoly(frames_m, [np.round(offset_quad(q, ring)).astype(np.int32)], 1)
    nlab, lab, st, cen = cv2.connectedComponentsWithStats(deco)
    gxD = np.abs(cv2.Sobel(D[..., 0], cv2.CV_32F, 1, 0, ksize=3) / 8) + np.abs(cv2.Sobel(D[..., 0], cv2.CV_32F, 0, 1, ksize=3) / 8)
    sprites = []
    hole = np.zeros((H, W), np.uint8)
    for i in range(1, nlab):
        x0, y0, w0, h0, area = st[i]
        if area > 1500:
            continue
        cx, cy = cen[i]
        if frames_m[y0:y0 + h0, x0:x0 + w0][lab[y0:y0 + h0, x0:x0 + w0] == i].all():
            continue  # entièrement dans la zone qui bouge d'un bloc
        if gxD[int(cy), int(cx)] < 0.01 and abs(D[int(cy), int(cx), 0]) < 1:
            continue
        m = (lab[y0:y0 + h0, x0:x0 + w0] == i)
        sprites.append((x0, y0, rgb[y0:y0 + h0, x0:x0 + w0].copy(), m, D[int(cy), int(cx)]))
        hole[y0:y0 + h0, x0:x0 + w0][m] = 1
    clean = cv2.inpaint(rgb, hole * 255, 4, cv2.INPAINT_TELEA) if hole.any() else rgb
    # déformation inverse exacte, ligne par ligne (déplacements horizontaux) : s + D(s) = x
    assert np.abs(D[..., 1]).max() < 1e-3, 'déplacements horizontaux seulement'
    xs = np.arange(W, dtype=np.float64)
    sx = np.empty((H, W), np.float32)
    for y in range(H):
        f = np.maximum.accumulate(xs + D[y, :, 0])
        sx[y] = np.interp(xs, f, xs)
    sy = np.repeat(np.arange(H, dtype=np.float32)[:, None], W, 1)
    out = cv2.remap(clean, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    # recollage des petits décors (fondu sur 1 px)
    for x0, y0, patch, m, d in sprites:
        if x0 == 0 or x0 + m.shape[1] >= W:   # décor coupé par le bord du papier : il reste au bord
            d = (0.0, 0.0)
        nx, ny = int(round(x0 + d[0])), int(round(y0 + d[1]))
        h0, w0 = m.shape
        if nx < 0 or ny < 0 or nx + w0 > W or ny + h0 > H:
            continue
        a = cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0.7)[..., None]
        reg = out[ny:ny + h0, nx:nx + w0].astype(np.float32)
        out[ny:ny + h0, nx:nx + w0] = np.clip(reg * (1 - a) + patch * a, 0, 255).astype(np.uint8)
    newq = [q + np.array(t, float) for q, t in zip(quads, shifts)]
    return out, newq, D


# ---------------------------------------------------------------- décors posés devant les cadres (3 photos)
def front_mask(name, shape):
    """Masque doux des décors qui passent devant les cadres (repris de l'ancien rendu détouré)."""
    from run_white import poly_mask, ellipse_mask
    if name != '3photos':
        return None
    m = np.zeros(shape, np.float32)
    for poly in DECOR_3PHOTOS:
        m = np.maximum(m, poly_mask(shape, poly))
    for e in DECOR_3PHOTOS_ELLIPSES:
        m = np.maximum(m, ellipse_mask(shape, *e))
    return cv2.GaussianBlur(m, (0, 0), 0.8)


# 3 photos : les deux flûtes de champagne (devant le 1er cadre) et le ballon transparent (devant le 3e)
DECOR_3PHOTOS = [
    [(56, 653), (100, 662), (140, 675), (164, 687), (160, 720), (154, 840), (6, 840), (28, 740), (48, 690)],
    [(158, 686), (200, 678), (240, 674), (269, 677), (276, 690), (282, 725), (288, 780), (294, 840), (163, 840)],
]
DECOR_3PHOTOS_ELLIPSES = [(1630, 795, 93, 105)]


def old_overlay(name, rgb):
    """Ancien rendu détouré (fenêtres transparentes, verres/ballon traités) servant pour les décors devant."""
    from run_white import retouches
    blobs = white_windows(rgb)
    out, alpha, wins, order = key_windows(rgb, blobs)
    retouches(name, out, alpha, rgb)
    return out.astype(np.float32), alpha


def build(name):
    from run_white import sample_photos
    spec = SPECS[name]
    W, H = spec['size']
    rgb = base_image(name, (W, H))
    quads = [refine_quad(rgb, b)[0] for b in white_windows(rgb)]
    fr_specs = spec['frames']
    fm = front_mask(name, (H, W))
    ovl = old_overlay(name, rgb) if fm is not None else None
    # fond sans l'ancienne dorure (l'ombre portée d'origine est gardée)
    hole = np.zeros((H, W), np.uint8)
    for q in quads:
        cv2.fillPoly(hole, [np.round(offset_quad(q, 17)).astype(np.int32)], 255)
    bg = cv2.inpaint(rgb, cv2.dilate(hole, np.ones((3, 3), np.uint8)), 5, cv2.INPAINT_TELEA)
    strips = [border_strips(rgb, q) for q in quads]   # texture dorée prise sur l'image d'origine
    shifts = [f.get('shift', (0, 0)) for f in fr_specs]
    if any(s != (0, 0) for s in shifts):
        protect = np.zeros((H, W), bool)
        protect[1150:, :] = True               # verres, ballons, bas de page
        protect[990:, 330:870] = True          # texte « 30 ans Jordan »
        bg, quads_m, D = smooth_shift(bg, quads, shifts, protect)
        fr_specs = [dict(f, shift=(0, 0)) for f in fr_specs]
    else:
        quads_m = quads
    frames = []
    for q, f in zip(quads_m, fr_specs):
        cx, cy = place(q, f)
        frames.append(dict(cx=cx, cy=cy, w=f['w'], h=f['h'], angle=f['angle']))
    order = spec.get('order', list(range(len(frames))))
    rf = draw_frames(bg, frames, strips, order, shadow=False)
    P = rf[..., :3] * rf[..., 3:4]
    A = rf[..., 3].copy()
    if fm is not None:  # décors devant : ancien rendu détouré par-dessus
        oc, oa = ovl
        m = fm[..., None]
        P = P * (1 - m) + (oc * oa[..., None]) * m
        A = A * (1 - fm) + oa * fm
    C = P / np.maximum(A, 1e-4)[..., None]
    rgba = np.dstack([np.clip(np.round(C), 0, 255).astype(np.uint8), np.clip(np.round(A * 255), 0, 255).astype(np.uint8)])
    rects = [dict(cx=f['cx'], cy=f['cy'], w=f['w'] + 2 * BLEED, h=f['h'] + 2 * BLEED, ang=float(f['angle'])) for f in frames]
    write_template(f'Jordan30_{name}', spec['title'], rgba, rects, W, H, order=order)
    photos = sample_photos()
    render_preview(rgba, rects, photos, order=order).save(f'out/apercu_{name}.jpg', quality=92)
    render_preview(rgba, rects, photos, with_boxes=True, order=order).save(f'out/controle_{name}.png')
    return rgba, rects, frames, quads_m


if __name__ == '__main__' and 'creme' not in sys.argv[1:]:
    for nm in sys.argv[1:] or list(SPECS):
        rgba, rects, frames, q = build(nm)
        print(nm, [to_xml_rect(r, *SPECS[nm]['size']) for r in rects])


# ---------------------------------------------------------------- modèle crème (3 photos droites)
CREME = dict(size=(1200, 1800), title='Jordan 30 ans - 3 photos droites (creme)', border=12,
             # fenêtres visibles (x0, y0, x1, y1) : 2 petites identiques + 1 grande, toutes droites
             windows=[(49, 86, 577, 520), (623, 86, 1151, 520), (76, 554, 1124, 1068)])

# rubans qui passent DEVANT les cadres sur l'original (coordonnées de la page 1200x1800)
RUBAN_GAUCHE = [
    [(0, 397), (20, 413), (40, 427), (45, 430), (45, 466), (40, 462), (20, 444), (0, 430)],          # bande du haut
    [(0, 529), (20, 524), (42, 519), (60, 515), (70, 511), (78, 505), (82, 508), (82, 525), (70, 533),
     (55, 542), (40, 551), (20, 558), (0, 564)],                                                      # bande du bas
]
RUBAN_DROITE = [[(1088, 20), (1132, 20), (1132, 52), (1160, 46), (1200, 44), (1200, 118), (1185, 118),
                 (1185, 76), (1165, 77), (1150, 79), (1120, 83), (1100, 83), (1088, 70)]]


def creme_front(rgb):
    """Masque doux des rubans à garder devant les cadres (forme dessinée + tri par couleur)."""
    from run_white import poly_mask
    import run_exemple as RE
    H, W, _ = rgb.shape
    f = rgb.astype(np.float32)
    mx = f.max(axis=2)
    sat = (mx - f.min(axis=2)) / np.maximum(mx, 1)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    gold = (hsv[..., 0] >= 8) & (hsv[..., 0] <= 35) & (sat > 0.22) & (mx > 90)
    shine = (mx > 200) & (sat < 0.35)                       # reflets clairs du ruban (sur fond bleu nuit)
    left = np.zeros((H, W), np.float32)
    for p in RUBAN_GAUCHE:
        left = np.maximum(left, poly_mask((H, W), p))
    left = np.maximum(left, RE.decor_keep(rgb, None))      # partie qui s'enroule devant la 1re photo
    left *= (gold | shine).astype(np.float32)
    right = np.zeros((H, W), np.float32)
    for p in RUBAN_DROITE:
        right = np.maximum(right, poly_mask((H, W), p))
    right *= gold.astype(np.float32)
    m = np.maximum(left, right)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    return np.clip(cv2.GaussianBlur(m, (0, 0), 0.6), 0, 1)


def build_creme():
    from run_white import sample_photos
    import run_exemple as RE
    W, H = CREME['size']
    B = CREME['border']
    rgb = base_image('exemple3photos', (W, H))
    olds = [RE.quad_from_border(rgb, b)[0] for b in RE.APPROX.values()]
    frames = [dict(cx=(x0 + x1) / 2, cy=(y0 + y1) / 2, w=x1 - x0, h=y1 - y0, angle=0, border=B)
              for x0, y0, x1, y1 in CREME['windows']]
    front = creme_front(rgb)
    # zone des nouveaux cadres (dorure + fenêtre)
    new_outer = np.zeros((H, W), np.uint8)
    for x0, y0, x1, y1 in CREME['windows']:
        new_outer[y0 - B:y1 + B, x0 - B:x1 + B] = 1
    # restes de l'ancienne dorure qui dépassent des nouveaux cadres -> fond reconstruit (fines bandes)
    old_band = np.zeros((H, W), np.uint8)
    for q in olds:
        cv2.fillPoly(old_band, [np.round(offset_quad(q, 17)).astype(np.int32)], 1)
    hole = (old_band > 0) & (new_outer == 0) & (front < 0.05)
    hole = cv2.dilate(hole.astype(np.uint8), np.ones((3, 3), np.uint8)) & (new_outer == 0)
    # on reconstruit en ignorant tout l'intérieur des nouveaux cadres (sinon l'ancienne dorure « bave » dans le fond)
    inner = cv2.dilate(new_outer, np.ones((3, 3), np.uint8)) > 0
    bg = cv2.inpaint(rgb, ((hole > 0) | inner).astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
    strips = [border_strips(rgb, q, rows=(1, 13), trim_rows=True) for q in olds]
    order = [0, 1, 2]
    rf = draw_frames(bg, frames, strips, order, shadow=False)
    P = rf[..., :3] * rf[..., 3:4]
    A = rf[..., 3].copy()
    m = front[..., None]
    P = P * (1 - m) + rgb.astype(np.float32) * m
    A = A * (1 - front) + front
    C = P / np.maximum(A, 1e-4)[..., None]
    rgba = np.dstack([np.clip(np.round(C), 0, 255).astype(np.uint8), np.clip(np.round(A * 255), 0, 255).astype(np.uint8)])
    rects = [dict(cx=f['cx'], cy=f['cy'], w=f['w'] + 2 * BLEED, h=f['h'] + 2 * BLEED, ang=0.0) for f in frames]
    write_template('Jordan30_3photos_creme', CREME['title'], rgba, rects, W, H, bg='#FFF4EEE2', order=order)
    photos = sample_photos()
    render_preview(rgba, rects, photos, order=order).save('out/apercu_3photos_creme.jpg', quality=92)
    render_preview(rgba, rects, photos, with_boxes=True, order=order).save('out/controle_3photos_creme.png')
    return rgba, rects, int(hole.sum())


if __name__ == '__main__' and 'creme' in sys.argv[1:]:
    rgba, rects, nh = build_creme()
    print('3photos_creme', [to_xml_rect(r, *CREME['size']) for r in rects], 'pixels reconstruits', nh)
