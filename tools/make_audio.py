"""Compose la musique et les effets sonores des vidéos (100 % originaux, libres de droits).

Usage : python tools/make_audio.py            -> effets sonores public/audio/sfx-*.wav
        python tools/make_audio.py --music 36 -> + une musique synthétique de secours (music.wav)
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def note(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, d):
    tt = t(d)
    return 2 * ((tt * f) % 1) - 1


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig


def save(name, x, stereo=None):
    x = np.tanh(x * 1.1)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    data = np.stack([x, stereo / peak * 0.89 if stereo is not None else x], 1) if stereo is not None else x
    wavfile.write(os.path.join(OUT, name), SR, (data * 32767).astype(np.int16))


# ── Instruments ──────────────────────────────────────────────
def kick():
    tt = t(0.45)
    f = 50 + 110 * np.exp(-tt * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    click = hp(rng.standard_normal(len(tt)), 2000) * np.exp(-tt * 300) * 0.12
    return body + click


def clap():
    tt = t(0.3)
    n = bp(rng.standard_normal(len(tt)), 900, 3500)
    env = np.exp(-tt * 18)
    for k in (0.0, 0.012, 0.024):
        env += (tt >= k) * np.exp(-(tt - k).clip(0) * 120) * 0.6
    return n * env * 0.35


def hat(open_=False):
    tt = t(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * (14 if open_ else 70)) * (0.1 if open_ else 0.07)


def pluck(f, d=0.35):
    tt = t(d)
    s = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * tt)
    return s * np.exp(-tt * 9) * (1 - np.exp(-tt * 400)) * 0.24


def pad(freqs, d):
    s = sum(saw(f * det, d) for f in freqs for det in (0.996, 1.0, 1.004))
    s = lp(s, 1500)
    tt = t(d)
    env = np.minimum(1, tt / 0.25) * np.minimum(1, (d - tt) / 0.3).clip(0)
    return s * env * 0.05


def bass(f, d):
    tt = t(d)
    s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    return np.tanh(s * 1.5) * np.exp(-tt * 3) * (1 - np.exp(-tt * 300)) * 0.32


# Progression feel-good en Fa : F – C – Dm – Bb (1 mesure chacun)
CHORDS = [
    (53, [65, 69, 72, 76]),  # F maj7
    (48, [64, 67, 72, 74]),  # C add9
    (50, [62, 65, 69, 72]),  # Dm7
    (46, [62, 65, 70, 74]),  # Bb add9
]


def music(duration):
    bar = 4 * BEAT
    n_bars = int(np.ceil(duration / bar)) + 1
    L = int((n_bars * bar + 2) * SR)
    drums, bassb, padb, arp = (np.zeros(L) for _ in range(4))
    sidechain = np.ones(L)
    intro_bars, outro_bar = 1, int((duration - 3) / bar)  # rythme après 1 mesure, accord final ~3 s avant la fin

    for b in range(n_bars):
        root, chord = CHORDS[b % 4]
        t0 = b * bar
        add(padb, pad([note(n) for n in chord], bar + 0.2), t0)
        # arpège en doubles-croches
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(16 if b >= intro_bars else 8):
            step = BEAT / 4 if b >= intro_bars else BEAT / 2
            add(arp, pluck(note(chord[pattern[k % 8]] + 12)), t0 + k * step)
        if intro_bars <= b < outro_bar:
            for q in range(4):
                tb = t0 + q * BEAT
                add(drums, kick(), tb)
                i = int(tb * SR)
                dl = int(0.25 * SR)
                sidechain[i : i + dl] = np.minimum(sidechain[i : i + dl], 0.35 + 0.65 * np.linspace(0, 1, len(sidechain[i : i + dl])) ** 0.6)
                add(drums, hat(open_=True), tb + BEAT / 2)
                add(drums, hat(), tb + BEAT / 4)
                add(drums, hat(), tb + 3 * BEAT / 4)
                if q in (1, 3):
                    add(drums, clap(), tb)
                add(bassb, bass(note(root - 12), BEAT / 2), tb + BEAT / 2)
            if b % 4 == 3:  # petit roulement de fin de phrase
                for k in range(4):
                    add(drums, clap() * (0.3 + k * 0.15), t0 + 3 * BEAT + k * BEAT / 4)
    # accord final
    end = outro_bar * bar
    root, chord = CHORDS[0]
    add(padb, pad([note(n) for n in chord + [root]], 3) * 2.5, end)
    add(bassb, bass(note(root - 12), 2) * 1.2, end)
    add(drums, kick() * 1.2, end)

    # écho stéréo sur l'arpège
    d = int(BEAT * 0.75 * SR)
    arpL = arp.copy()
    arpR = arp.copy()
    arpR[d:] += arp[:-d] * 0.45
    arpL[2 * d :] += arp[: -2 * d] * 0.25
    padb *= sidechain
    bassb *= sidechain ** 0.5
    L_ = drums + bassb + padb + arpL
    R_ = drums + bassb + padb + arpR
    n = int(duration * SR)
    fade = np.ones(n)
    fade[-int(1.5 * SR) :] = np.linspace(1, 0, int(1.5 * SR))
    fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
    return L_[:n] * fade, R_[:n] * fade


# ── Effets sonores ──────────────────────────────────────────
def sfx():
    # déclencheur photo : deux clics mécaniques
    tt = t(0.25)
    shutter = np.zeros(len(tt))
    for k, g in ((0.0, 1.0), (0.07, 0.7)):
        c = bp(rng.standard_normal(len(tt)), 1500, 7000) * np.exp(-(tt - k).clip(0) * 90) * (tt >= k) * g
        shutter += c
    save('sfx-shutter.wav', shutter)
    # bip de compte à rebours
    tt = t(0.14)
    save('sfx-beep.wav', np.sin(2 * np.pi * 988 * tt) * np.minimum(1, (0.14 - tt) * 40) * 0.6)
    tt = t(0.3)
    save('sfx-beep-high.wav', np.sin(2 * np.pi * 1976 * tt) * np.exp(-tt * 8) * 0.6)
    # whoosh
    tt = t(0.6)
    n = rng.standard_normal(len(tt))
    env = np.sin(np.pi * tt / 0.6) ** 2
    w = np.zeros_like(n)
    for k in range(6):
        seg = slice(k * len(tt) // 6, (k + 1) * len(tt) // 6)
        w[seg] = bp(n, 300 + 600 * k, 1200 + 1500 * k)[seg]
    save('sfx-whoosh.wav', w * env * 0.6)
    # imprimante : moteur + papier
    tt = t(1.6)
    motor = (np.sin(2 * np.pi * 120 * tt) * 0.5 + bp(rng.standard_normal(len(tt)), 200, 1200)) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt))
    env = np.minimum(1, tt / 0.1) * np.minimum(1, (1.6 - tt) / 0.15)
    save('sfx-printer.wav', motor * env * 0.4)
    # ding (cloche)
    tt = t(1.5)
    bell = sum(np.sin(2 * np.pi * 1318 * r * tt) * np.exp(-tt * dcy) * a for r, dcy, a in ((1, 3, 1), (2.76, 5, 0.4), (5.4, 8, 0.2)))
    save('sfx-ding.wav', bell * 0.5)
    # pop
    tt = t(0.12)
    f = 900 * np.exp(-tt * 25) + 200
    save('sfx-pop.wav', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35))
    # scintillement (étoiles / avis)
    tt = t(1.2)
    sp = np.zeros(len(tt))
    for k, nn in enumerate([84, 88, 91, 96, 100]):
        add(sp, np.sin(2 * np.pi * note(nn) * t(0.6)) * np.exp(-t(0.6) * 7) * 0.35, k * 0.07)
    save('sfx-sparkle.wav', sp)


def sfx_funny():
    # gonflage : souffle qui monte (bruit filtré dont la bande s'élève) + petit sifflement
    d = 0.9
    tt = t(d)
    n = rng.standard_normal(len(tt))
    out = np.zeros_like(n)
    steps = 12
    for k in range(steps):
        seg = slice(k * len(tt) // steps, (k + 1) * len(tt) // steps)
        lo = 250 + 120 * k
        out[seg] = bp(n, lo, lo * 3)[seg]
    whistle = np.sin(2 * np.pi * np.cumsum(300 + 500 * (tt / d) ** 1.5) / SR) * 0.15
    env = np.minimum(1, tt / 0.08) * np.minimum(1, (d - tt) / 0.06)
    save('sfx-inflate.wav', (out * 0.8 + whistle) * env)
    # boing : sinus qui vibre et descend
    tt = t(0.6)
    f = 180 + 220 * np.exp(-tt * 6) * (1 + 0.35 * np.sin(2 * np.pi * 14 * tt))
    save('sfx-boing.wav', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5))
    # confettis : claquement + crépitement
    tt = t(0.9)
    pop = hp(rng.standard_normal(len(tt)), 800) * np.exp(-tt * 60)
    crackle = np.zeros(len(tt))
    for _ in range(40):
        at = rng.uniform(0.02, 0.7)
        add(crackle, hp(rng.standard_normal(int(0.012 * SR)), 3000) * rng.uniform(0.1, 0.4), at)
    save('sfx-confetti.wav', pop + crackle)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    if '--music' in sys.argv:
        dur = float(sys.argv[sys.argv.index('--music') + 1])
        l, r = music(dur)
        save('music.wav', l, r)
    sfx()
    sfx_funny()
    print('ok', sorted(os.listdir(OUT)))
