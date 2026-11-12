import os
import sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import *
from keying import key_windows


def poly_mask(shape, pts, ss=4):
    H, W = shape
    m = np.zeros((H * ss, W * ss), np.uint8)
    cv2.fillPoly(m, [np.round(np.array(pts, np.float64) * ss + (ss - 1) / 2).astype(np.int32)], 255)
    return cv2.resize(m.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_AREA)


def ellipse_mask(shape, cx, cy, rx, ry, ss=4):
    H, W = shape
    m = np.zeros((H * ss, W * ss), np.uint8)
    cv2.ellipse(m, (int(cx * ss), int(cy * ss)), (int(rx * ss), int(ry * ss)), 0, 0, 360, 255, -1)
    return cv2.resize(m.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_AREA)


def veil(out, alpha, cov, a_v=0.18, col=(250, 250, 250)):
    """Léger voile de verre (verre, ballon transparent) là où la fenêtre est transparente."""
    av = a_v * cov
    new_a = 1 - (1 - alpha) * (1 - av)
    w_old = alpha / np.maximum(new_a, 1e-4)
    o = out.astype(np.float32)
    o = o * w_old[..., None] + np.array(col, np.float32) * (1 - w_old)[..., None]
    sel = cov > 0
    out[sel] = np.clip(o[sel], 0, 255).astype(np.uint8)
    alpha[sel] = new_a[sel]


def solid(out, alpha, rgb, cov):
    """Zone forcée opaque (liquide et mousse du champagne) avec la couleur d'origine."""
    sel = cov > 0
    a2 = np.maximum(alpha, cov)
    w = cov / np.maximum(a2, 1e-4)
    o = out.astype(np.float32) * (1 - w)[..., None] + rgb.astype(np.float32) * w[..., None]
    out[sel] = np.clip(o[sel], 0, 255).astype(np.uint8)
    alpha[sel] = a2[sel]


# Cadres trop près du bord du papier : on fait pivoter légèrement les cadres photo autour de leur point de
# croisement (les coins du haut s'écartent des bords), sans toucher au fond ni aux grands décors.
# nom -> marge minimale (px à 300 dpi) entre la dorure et le bord du papier
FRAME_FIX = {'2photos': 44}


def relayout(name, rgb):
    from keying import refine_quad, offset_quad, key_windows
    if name not in FRAME_FIX:
        return rgb
    margin = FRAME_FIX[name]
    H, W, _ = rgb.shape
    blobs = white_windows(rgb)
    quads = [refine_quad(rgb, b)[0] for b in blobs]
    order = key_windows(rgb, blobs)[3]
    def poly(q, off):
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.round(offset_quad(q, off)).astype(np.int32)], 1)
        return m.astype(bool)
    o16 = [poly(q, 16) for q in quads]
    # pivot de chaque cadre : son coin extérieur du bas (côté bord du papier) -> le bas du cadre bouge à peine
    pivots = []
    for q in quads:
        q16 = offset_quad(q, 16)
        bottom = q16[np.argsort(q16[:, 1])[-2:]]
        pivots.append(bottom[np.argmin(bottom[:, 0])] if q[:, 0].mean() < W / 2 else bottom[np.argmax(bottom[:, 0])])
    def rot(pts, th, P):
        c, s_ = math.cos(th), math.sin(th)
        v = pts - P
        return P + np.stack([c * v[:, 0] - s_ * v[:, 1], s_ * v[:, 0] + c * v[:, 1]], 1)
    angles = []
    for q, P in zip(quads, pivots):
        outer = offset_quad(q, 16)
        best = 0.0
        for k in range(0, 161):
            ok = None
            for sg in (1, -1):
                th = math.radians(sg * k * 0.05)
                r = rot(outer, th, P)
                if r[:, 0].min() >= margin and r[:, 0].max() <= W - 1 - margin and r[:, 1].min() >= margin:
                    ok = th
                    break
            if ok is not None:
                best = ok
                break
        angles.append(best)
    # décors : petits (perles, étoiles) -> suivent le cadre ; grands (pinceaux, rubans) -> restent en place
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    deco = ((hsv[..., 0] >= 8) & (hsv[..., 0] <= 35) & (hsv[..., 1] > 70) & (hsv[..., 2] > 100)) | (hsv[..., 2] > 200)
    deco = cv2.dilate(deco.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    allo16 = np.logical_or.reduce(o16)
    deco_out = deco & ~allo16
    n, lab, st, _ = cv2.connectedComponentsWithStats(deco_out.astype(np.uint8))
    regions = []
    for i, (q, f16) in enumerate(zip(quads, o16)):
        above = [j for j in order[order.index(i) + 1:]]
        others = np.logical_or.reduce([o16[j] for j in range(len(quads)) if j != i]) if len(quads) > 1 else np.zeros((H, W), bool)
        r40 = poly(q, 40)
        touch = np.unique(lab[r40 & ~f16])
        ring = r40 & ~f16
        for k_ in touch:
            if not k_:
                continue
            comp = lab == k_
            if st[k_, 4] < 1500:
                ring |= cv2.dilate(comp.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
            else:
                ring &= ~comp
        ring &= ~others  # pas de morceaux des autres cadres dans l'anneau
        core = f16.copy()
        for j in above:
            core &= ~o16[j]  # partie cachée sous un cadre du dessus : inconnue, le cadre du dessus la recouvre
        regions.append(core | ring)
    hole = cv2.dilate(np.logical_or.reduce(regions).astype(np.uint8) * 255, np.ones((3, 3), np.uint8))
    out = cv2.inpaint(rgb, hole, 5, cv2.INPAINT_TELEA).astype(np.float32)
    # source haute définition pour la rotation (plus net)
    src = os.path.join(S, 'x4', f'{name}.png')
    hi = np.array(Image.open(src).convert('RGB')) if os.path.exists(src) else rgb
    k = hi.shape[1] / W
    for i in order:  # du dessous vers le dessus
        deg = math.degrees(angles[i])
        P = pivots[i]
        M = cv2.getRotationMatrix2D((float(P[0] * k), float(P[1] * k)), -deg, 1.0)
        big = cv2.warpAffine(hi, M, (hi.shape[1], hi.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        lay = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)
        Ms = cv2.getRotationMatrix2D((float(P[0]), float(P[1])), -deg, 1.0)
        m = cv2.warpAffine(regions[i].astype(np.float32), Ms, (W, H), flags=cv2.INTER_LINEAR)
        m = cv2.erode(m, np.ones((3, 3), np.uint8))
        m = cv2.GaussianBlur(m, (0, 0), 2.0)[..., None]
        out = out * (1 - m) + lay * m
    print('relayout', name, 'pivots', [np.round(p, 1).tolist() for p in pivots], 'angles', [round(math.degrees(a), 2) for a in angles])
    return np.clip(out, 0, 255).astype(np.uint8)


def retouches(name, out, alpha, rgb):
    sh = alpha.shape
    if name == '3photos':
        # champagne : liquide + mousse opaques (pas de trous), verre légèrement voilé
        solid(out, alpha, rgb, poly_mask(sh, [(160, 726), (200, 724), (240, 727), (278, 731), (281, 752), (283, 800), (160, 800)]))
        solid(out, alpha, rgb, poly_mask(sh, [(96, 709), (158, 715), (156, 800), (96, 800)]))
        veil(out, alpha, poly_mask(sh, [(163, 688), (205, 681), (268, 679), (281, 734), (240, 727), (200, 724), (162, 726)]))
        veil(out, alpha, poly_mask(sh, [(96, 656), (158, 688), (157, 715), (96, 709)]))
        # ballon transparent devant la 3e photo
        veil(out, alpha, ellipse_mask(sh, 1627, 795, 90, 103), a_v=0.2)

def sample_photos():
    """Photos d'exemple pour les aperçus (tirées de l'exemple fourni ; version agrandie par l'IA si dispo)."""
    boxes = [(52, 78, 398, 356), (446, 74, 798, 356), (68, 400, 778, 738)]  # sans les bordures ni le ruban
    if os.path.exists('x4/exemple3photos.png'):
        ex = Image.open('x4/exemple3photos.png').convert('RGB')
        k = ex.width / 843
        return [ex.crop(tuple(int(round(v * k)) for v in b)) for b in boxes]
    ex = Image.open('src/exemple3photos.jpg').convert('RGB')
    return [ex.crop(b) for b in boxes]

cfg = {
    '1photo':  ((1200, 1800), 'Jordan 30 ans - 1 photo'),
    '2photos': ((1200, 1800), 'Jordan 30 ans - 2 photos'),
    '3photos': ((1800, 1200), 'Jordan 30 ans - 3 photos paysage'),
}
if __name__ == '__main__':
    photos = sample_photos()
    for name in sys.argv[1:]:
        (W, H), title = cfg[name]
        rgb = relayout(name, base_image(name, (W, H)))
        blobs = white_windows(rgb)
        out, alpha, wins, order = key_windows(rgb, blobs)
        retouches(name, out, alpha, rgb)
        rgba = np.dstack([out, np.round(alpha * 255).astype(np.uint8)])
        rects = placeholders(alpha, blobs, order)
        write_template(f'Jordan30_{name}', title, rgba, rects, W, H, order=order)
        print(name, 'ordre z (dessous -> dessus):', order)
        render_preview(rgba, rects, photos, order=order).save(f'out/apercu_{name}.jpg', quality=92)
        render_preview(rgba, rects, photos, with_boxes=True, order=order).save(f'out/controle_{name}.png')
        for (q, info), r in zip(wins, rects):
            print(name, 'quad', np.round(q, 1).tolist(), 'inliers', info, '| case', to_xml_rect(r, W, H), 'debord', r['bleed'], 'non couvert', r['missed'], 'empiete', r['overlap'])
