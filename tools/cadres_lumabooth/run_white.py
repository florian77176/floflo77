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
    ex = Image.open('src/exemple3photos.jpg').convert('RGB')
    return [ex.crop((36, 66, 405, 362)), ex.crop((438, 66, 806, 362)), ex.crop((56, 392, 787, 744))]

cfg = {
    '1photo':  ((1200, 1800), 'Jordan 30 ans - 1 photo'),
    '2photos': ((1200, 1800), 'Jordan 30 ans - 2 photos'),
    '3photos': ((1800, 1200), 'Jordan 30 ans - 3 photos paysage'),
}
if __name__ == '__main__':
    photos = sample_photos()
    for name in sys.argv[1:]:
        (W, H), title = cfg[name]
        rgb = base_image(name, (W, H))
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
