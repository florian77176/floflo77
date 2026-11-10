import sys, numpy as np, torch
from PIL import Image
from spandrel import ModelLoader
torch.set_num_threads(4)
model = ModelLoader(device='cpu').load_from_file(sys.argv[1]).eval()
for src, dst in zip(sys.argv[2::2], sys.argv[3::2]):
    img = Image.open(src).convert('RGB')
    x = torch.from_numpy(np.array(img)).float().div(255).permute(2, 0, 1)[None]
    tile, pad = 256, 16
    _, _, H, W = x.shape
    out = torch.zeros(1, 3, H * 4, W * 4)
    with torch.inference_mode():
        for y0 in range(0, H, tile):
            for x0 in range(0, W, tile):
                ya, xa = max(0, y0 - pad), max(0, x0 - pad)
                yb, xb = min(H, y0 + tile + pad), min(W, x0 + tile + pad)
                r = model(x[:, :, ya:yb, xa:xb])
                oy, ox = (y0 - ya) * 4, (x0 - xa) * 4
                th, tw = min(tile, H - y0) * 4, min(tile, W - x0) * 4
                out[:, :, y0*4:y0*4+th, x0*4:x0*4+tw] = r[:, :, oy:oy+th, ox:ox+tw]
    Image.fromarray((out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)).save(dst)
    print('ok', dst, flush=True)
