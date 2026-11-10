"""Découpe propre des fenêtres photo : géométrie (rectangle tourné calé sur le bord intérieur de la bordure dorée)
+ couleur (les décors posés devant la fenêtre restent opaques, le verre reste translucide)."""
import math
import cv2
import numpy as np
from build import rect_from_points


def _sample(img, xs, ys):
    xs = np.clip(np.round(xs).astype(int), 0, img.shape[1] - 1)
    ys = np.clip(np.round(ys).astype(int), 0, img.shape[0] - 1)
    return img[ys, xs]


def _fit_line(P, thr=1.5, iters=600, seed=0):
    """Droite robuste (RANSAC) : la bordure est la droite la plus soutenue ; les décors posés devant
    (verres, ballons) donnent des points aberrants qui sont ignorés."""
    rng = np.random.default_rng(seed)
    best = None
    n = len(P)
    for _ in range(iters):
        i, j = rng.choice(n, 2, replace=False)
        d = P[j] - P[i]
        L = np.linalg.norm(d)
        if L < 20:
            continue
        d = d / L
        nrm = np.array([-d[1], d[0]])
        inl = np.abs((P - P[i]) @ nrm) < thr
        if best is None or inl.sum() > best.sum():
            best = inl
    Q = P[best]
    m = Q.mean(0)
    _, _, vt = np.linalg.svd(Q - m)
    return m, vt[0], best.mean()


def _intersect(m1, d1, m2, d2):
    A = np.array([d1, -d2]).T
    t = np.linalg.solve(A, m2 - m1)
    return m1 + t[0] * d1


def refine_quad(rgb, core):
    """Quadrilatère de la fenêtre : chaque côté calé sur le début de la dorure (saturation), droite robuste."""
    ys, xs = np.nonzero(core)
    cx, cy, w, h, ang = rect_from_points(np.stack([xs, ys], 1))
    f = rgb.astype(np.float32)
    mx = f.max(axis=2)
    sat = (mx - f.min(axis=2)) / np.maximum(mx, 1)
    gold = sat > 0.2
    th = math.radians(ang)
    u = np.array([math.cos(th), math.sin(th)])
    v = np.array([-math.sin(th), math.cos(th)])
    c = np.array([cx, cy])
    lines = {}
    info = {}
    for side, (n, half, t, tl) in {
        'top': (-v, h / 2, u, w), 'right': (u, w / 2, v, h),
        'bottom': (v, h / 2, u, w), 'left': (-u, w / 2, v, h)}.items():
        pts = []
        for sv in np.arange(-0.44 * tl, 0.44 * tl, 2.0):
            for d in np.arange(-14, 26, 0.5):
                p = c + (half + d) * n + sv * t
                q1 = c + (half + d + 1) * n + sv * t
                q2 = c + (half + d + 2) * n + sv * t
                g = _sample(gold, np.array([p[0], q1[0], q2[0]]), np.array([p[1], q1[1], q2[1]]))
                if g.all():
                    pts.append(c + (half + d - 0.5) * n + sv * t)
                    break
        P = np.array(pts)
        m, d, inl = _fit_line(P)
        lines[side] = (m, d)
        info[side] = round(float(inl), 2)
    order = ['top', 'right', 'bottom', 'left']
    quad = []
    for i in range(4):
        a, b = order[i - 1], order[i]
        quad.append(_intersect(*lines[a], *lines[b]))
    # coins : (gauche/haut), (haut/droite), (droite/bas), (bas/gauche)
    return np.array(quad), info


def quad_coverage(shape, quad, inset=0.4, ss=4):
    H, W = shape
    cen = quad.mean(0)
    q = cen + (quad - cen) * (1 - inset / np.linalg.norm(quad - cen, axis=1, keepdims=True))
    m = np.zeros((H * ss, W * ss), np.uint8)
    cv2.fillPoly(m, [np.round(q * ss + (ss - 1) / 2).astype(np.int32)], 255)
    return cv2.resize(m.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_AREA)


def offset_quad(quad, B):
    """Décale chaque côté du quadrilatère de B px vers l'extérieur."""
    cen = quad.mean(0)
    lines = []
    for i in range(4):
        p, q = quad[i], quad[(i + 1) % 4]
        d = (q - p) / np.linalg.norm(q - p)
        n = np.array([-d[1], d[0]])
        if np.dot((p + q) / 2 - cen, n) < 0:
            n = -n
        lines.append((p + B * n, d))
    return np.array([_intersect(*lines[i - 1], *lines[i]) for i in range(4)])


def key_windows(rgb, blobs, border=13):
    """Renvoie (rgb_out, alpha, quads, ordre_z). alpha=1 opaque, 0 transparent.
    Dans la fenêtre : neutre (blanc, gris, ombre, reflet) -> transparent ; doré/coloré ou très sombre -> opaque.
    Si un cadre passe par-dessus un autre, sa bordure reste opaque dans la fenêtre du dessous."""
    H, W, _ = rgb.shape
    f = rgb.astype(np.float32)
    mx = f.max(axis=2)
    sat = (mx - f.min(axis=2)) / np.maximum(mx, 1)
    a_px = np.maximum(np.clip((sat - 0.10) / 0.16, 0, 1), np.clip((95 - mx) / 55, 0, 1))
    fits = [refine_quad(rgb, b) for b in blobs]
    quads = [q for q, _ in fits]
    cov = [quad_coverage((H, W), q) for q in quads]
    big = [quad_coverage((H, W), offset_quad(q, border), inset=0) for q in quads]
    n = len(quads)
    # qui est dessus ? la bordure de i est-elle visible (dorée) à l'intérieur du quadrilatère de j ?
    above = np.zeros((n, n), bool)
    for i in range(n):
        ring = (big[i] > 0.5) & (cov[i] < 0.5)
        for j in range(n):
            if i == j:
                continue
            ov = ring & (cov[j] > 0.5)
            if ov.sum() > 50 and (sat[ov] > 0.2).mean() > 0.6:
                above[i, j] = True
    alpha = np.ones((H, W), np.float32)
    out = f.copy()
    for j, b in enumerate(blobs):
        A = cov[j].copy()
        for i in range(n):
            if above[i, j]:
                A *= (1 - big[i])
        zone = A > 0
        Wc = np.median(f[b], axis=0)
        a_full = np.ones((H, W), np.float32)
        a_full[zone] = a_px[zone]
        tr = ((a_full < 0.5) & (A > 0.5)).astype(np.uint8)
        nc, lab, st, _ = cv2.connectedComponentsWithStats(tr, connectivity=8)
        if nc > 2:
            keep = 1 + int(np.argmax(st[1:, 4]))
            near = cv2.dilate((lab == keep).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
            for i in range(1, nc):
                if i != keep and (st[i, 4] < 400 or not (near & (lab == i)).any()):
                    a_full[lab == i] = 1.0
        fin = 1 - A * (1 - a_full)
        Fz = np.clip((f - (1 - a_full)[..., None] * Wc) / np.maximum(a_full, 1e-3)[..., None], 0, 255)
        sel = zone & (a_full < 1)
        out[sel] = Fz[sel]
        edge = zone & (A < 0.999) & (fin < 0.999)
        if edge.any():
            opaque_out = (~zone) | (a_full >= 0.98)
            wts = cv2.GaussianBlur(opaque_out.astype(np.float32), (0, 0), 1.6)
            col = cv2.GaussianBlur(f * opaque_out[..., None], (0, 0), 1.6) / np.maximum(wts, 1e-4)[..., None]
            out[edge] = col[edge]
        alpha = np.minimum(alpha, fin)
    # ordre z (du dessous vers le dessus) : un cadre « dessus » passe après
    order = list(range(n))
    changed = True
    while changed:
        changed = False
        for a_ in range(n):
            for b_ in range(n):
                if above[a_, b_] and order.index(a_) < order.index(b_):
                    order.remove(a_); order.insert(order.index(b_) + 1, a_); changed = True
    return np.clip(out, 0, 255).astype(np.uint8), alpha, fits, order
