import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *
from keying import _fit_line, _intersect, _sample, offset_quad
from run_white import poly_mask

NAME = 'exemple3photos'
W, H = 1200, 1800
APPROX0 = {  # bord intérieur approximatif (gauche, haut, droite, bas), image d'origine
    'TL': (51, 97, 580, 517),
    'TR': (619, 89, 1152, 518),
    'BIG': (77, 558, 1121, 1067),
}
APPROX = {k: tuple(v for p in safe_map(NAME, [(b[0], b[1]), (b[2], b[3])], (W, H)) for v in p) for k, b in APPROX0.items()}


def gold_mask(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    return (hsv[..., 0] >= 8) & (hsv[..., 0] <= 35) & (hsv[..., 1] > 55) & (hsv[..., 2] > 120)


def quad_from_border(rgb, box):
    g = gold_mask(rgb)
    x0, y0, x1, y1 = box
    c = np.array([(x0 + x1) / 2, (y0 + y1) / 2])
    hw, hh = (x1 - x0) / 2, (y1 - y0) / 2
    sides = {'top': (np.array([0, -1.]), hh, np.array([1, 0.]), 2 * hw),
             'right': (np.array([1, 0.]), hw, np.array([0, 1.]), 2 * hh),
             'bottom': (np.array([0, 1.]), hh, np.array([1, 0.]), 2 * hw),
             'left': (np.array([-1, 0.]), hw, np.array([0, 1.]), 2 * hh)}
    lines, info = {}, {}
    for side, (n, half, t, tl) in sides.items():
        pts = []
        for sv in np.arange(-0.46 * tl, 0.46 * tl, 2.0):
            ds = np.arange(22, -16, -0.5)  # de l'extérieur vers l'intérieur
            P = c[None] + (half + ds)[:, None] * n[None] + sv * t[None]
            gv = _sample(g, P[:, 0], P[:, 1])
            # première bande dorée d'au moins 3 px (6 pas), puis on la suit jusqu'à sa fin intérieure
            run = 0
            start = None
            for k, v in enumerate(gv):
                run = run + 1 if v else 0
                if run >= 6:
                    start = k
                    break
            if start is None:
                continue
            k = start
            while k + 1 < len(gv) and gv[k + 1]:
                k += 1
            d_in = ds[k] - 0.25
            if ds[start - 5] - d_in > 16:  # bande trop large : ballon doré collé, on ignore
                continue
            pts.append(c + (half + d_in) * n + sv * t)
        P = np.array(pts)
        m, d, inl = _fit_line(P, thr=1.2)
        lines[side] = (m, d)
        info[side] = (len(P), round(float(inl), 2))
    order = ['top', 'right', 'bottom', 'left']
    quad = np.array([_intersect(*lines[order[i - 1]], *lines[order[i]]) for i in range(4)])
    return quad, info


if __name__ == '__main__' and len(sys.argv) == 1:
    rgb = base_image(NAME, (W, H))
    for k, box in APPROX.items():
        q, info = quad_from_border(rgb, box)
        print(k, np.round(q, 1).tolist(), info)


def build():
    from keying import quad_coverage
    rgb = base_image(NAME, (W, H))
    f = rgb.astype(np.float32)
    alpha = np.ones((H, W), np.float32)
    out = f.copy()
    quads = []
    blobs = []
    for k, box in APPROX.items():
        q, info = quad_from_border(rgb, box)
        quads.append(q)
        A = quad_coverage((H, W), q, inset=0.3)
        alpha = np.minimum(alpha, 1 - A)
        blobs.append(A > 0.5)
    # décors qui passent devant les photos (ruban doré à gauche) : restent opaques
    keep = decor_keep(rgb, quads)
    alpha = np.maximum(alpha, keep)
    # pixels du bord partiellement transparents : couleur de la dorure voisine
    edge = (alpha > 0.001) & (alpha < 0.999)
    opaque = alpha >= 0.999
    wts = cv2.GaussianBlur(opaque.astype(np.float32), (0, 0), 1.6)
    col = cv2.GaussianBlur(f * opaque[..., None], (0, 0), 1.6) / np.maximum(wts, 1e-4)[..., None]
    out[edge & (keep < 0.5)] = col[edge & (keep < 0.5)]
    out[alpha <= 0.001] = 0
    return rgb, np.clip(out, 0, 255).astype(np.uint8), alpha, quads, blobs


def decor_keep(rgb, quads):
    # ruban doré qui s'enroule devant le coin bas-gauche de la 1re photo
    ribbon = [(52, 441), (56, 445), (60, 450), (64, 455), (68, 461), (72, 468), (75, 476), (78, 486), (80, 497),
              (81, 510), (81, 524), (60, 524), (60, 505), (60.5, 490), (60, 478), (58, 471), (52, 467), (40, 467), (40, 441)]
    # creux de la boucle : on y voit la photo
    lens = [(52, 468), (57, 470), (62, 474), (67, 479), (71, 485), (74, 491), (75.5, 497), (75, 503), (72, 508),
            (67, 512), (61, 515), (55, 517), (52, 518)]
    ribbon, lens = safe_map(NAME, ribbon, (W, H)), safe_map(NAME, lens, (W, H))
    return np.clip(poly_mask(rgb.shape[:2], ribbon) - poly_mask(rgb.shape[:2], lens), 0, 1)


def main():
    from run_white import sample_photos
    rgb, out, alpha, quads, blobs = build()
    rgba = np.dstack([out, np.round(alpha * 255).astype(np.uint8)])
    rects = placeholders(alpha, blobs)
    for q, r in zip(quads, rects):
        print('quad', np.round(q, 1).tolist(), '| case', to_xml_rect(r, W, H), 'debord', r['bleed'], 'non couvert', r['missed'], 'empiete', r['overlap'])
    write_template('Jordan30_3photos_creme', 'Jordan 30 ans - 3 photos (creme)', rgba, rects, W, H, bg='#FFF4EEE2')
    photos = sample_photos()
    render_preview(rgba, rects, photos).save('out/apercu_3photos_creme.jpg', quality=92)
    render_preview(rgba, rects, photos, with_boxes=True).save('out/controle_3photos_creme.png')


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'build':
    main()
