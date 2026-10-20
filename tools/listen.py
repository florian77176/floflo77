"""« Oreille » IA : décrit des musiques sans les écouter.
Tempo, régularité, énergie, moment fort (drop), basses, et étiquettes AudioSet (humeur, style, voix)
via le modèle AST (MIT/ast-finetuned-audioset-10-10-0.4593).

Usage : python tools/listen.py fichier1.mp3 [fichier2.mp3 ...]  → JSON sur la sortie standard
"""
import json
import sys

import librosa
import numpy as np
import torch
from transformers import ASTFeatureExtractor, ASTForAudioClassification

NAME = 'MIT/ast-finetuned-audioset-10-10-0.4593'
fe = ASTFeatureExtractor.from_pretrained(NAME)
model = ASTForAudioClassification.from_pretrained(NAME).eval()
labels = model.config.id2label
MOODS = ['Happy music', 'Exciting music', 'Funny music', 'Tender music', 'Sad music', 'Angry music', 'Scary music']
STYLES = ['Pop music', 'Electronic dance music', 'Hip hop music', 'Funk', 'Rock music', 'Disco', 'House music', 'Techno',
          'Dubstep', 'Electronic music', 'Jazz', 'Reggae', 'Country', 'Music for children', 'Video game music', 'Ukulele',
          'Brass instrument', 'Synthesizer', 'Drum machine', 'Guitar', 'Piano', 'Whistling']
VOICE = ['Singing', 'Speech', 'Rapping', 'Choir']

out = {}
for f in sys.argv[1:]:
    y, sr = librosa.load(f, sr=22050, mono=True)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    tempo = float(np.atleast_1d(tempo)[0])
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    t = librosa.times_like(rms, sr=sr, hop_length=512)
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    bass = float(S[(freqs >= 40) & (freqs < 150)].sum() / (S.sum() + 1e-9))
    # drop = plus forte hausse d'énergie entre deux phrases de 8 temps
    drops = []
    for i in range(8, len(beats) - 8, 4):
        a = (t >= beats[i - 8]) & (t < beats[i])
        b = (t >= beats[i]) & (t < beats[i + 8])
        if a.any() and b.any():
            drops.append((float(rms[b].mean() / (rms[a].mean() + 1e-9)), float(beats[i])))
    drops.sort(reverse=True)
    # étiquettes AudioSet sur 3 fenêtres de 10 s (début, moment fort, milieu)
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
    probs = []
    starts = sorted({0.0, max(0.0, drops[0][1] if drops else 0.0), len(y16) / 16000 / 2})
    for s0 in starts:
        seg = y16[int(s0 * 16000): int((s0 + 10) * 16000)]
        if len(seg) < 16000:
            continue
        with torch.inference_mode():
            logits = model(**fe(seg, sampling_rate=16000, return_tensors='pt')).logits[0]
        probs.append(torch.sigmoid(logits).numpy())
    p = np.mean(probs, axis=0)
    lab = {labels[i]: float(p[i]) for i in range(len(p))}
    out[f] = {
        'tempo': round(tempo, 1),
        'beat': round(float(np.median(np.diff(beats))), 4) if len(beats) > 2 else None,
        'first_beat': round(float(beats[0]), 2) if len(beats) else None,
        'duration': round(len(y) / sr, 1),
        'energy': round(float(rms.mean()), 3),
        'punch': round(float(onset.mean()), 2),
        'bass': round(bass, 3),
        'drops': [(round(r, 2), round(s, 2)) for r, s in drops[:3]],
        'moods': {k: round(lab.get(k, 0.0), 2) for k in MOODS},
        'styles': {k: round(v, 2) for k, v in sorted(((k, lab.get(k, 0.0)) for k in STYLES), key=lambda x: -x[1])[:4]},
        'voice': {k: round(lab.get(k, 0.0), 2) for k in VOICE},
    }
    print(f, out[f]['tempo'], file=sys.stderr, flush=True)
print(json.dumps(out, ensure_ascii=False, indent=1))
