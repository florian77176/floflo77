"""Génère la voix off française (Chatterbox, licence MIT) phrase par phrase.

Usage : python tools/make_voice.py reference.wav
  reference.wav : quelques secondes d'une voix française native dont on reprend le timbre et l'accent
Écrit public/audio/voice/<id>.wav et affiche la durée de chaque phrase.
"""
import difflib
import json
import os
import re
import subprocess
import sys

import torch
import torchaudio
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio', 'voice')

# Texte de la voix off (« Pho Events » est prononcé « Fo-Évent »)
LINES = {
    'hook': 'Vous préparez un mariage, un anniversaire ou une soirée ? Regardez ça !',
    'smile': 'Et maintenant… souriez !',
    'tpl-mariage': 'Pour votre mariage : une bandelette élégante, à vos deux prénoms.',
    'tpl-anniversaire': 'Pour un anniversaire : quatre photos, et des étoiles plein les yeux !',
    'tpl-bapteme': 'Pour un baptême : un grand portrait, tout en douceur.',
    'tpl-babyshower': 'Pour une baby shower : un cadre tendre, aux couleurs de bébé.',
    'tpl-entreprise': 'Et pour votre entreprise : votre logo, vos couleurs, votre image !',
    'prints': 'Les photos sont imprimées sur place : vos invités repartent avec leur souvenir !',
    'included': "Photos illimitées, livraison, installation : on s'occupe de tout !",
    'formulas': 'Le tout, à partir de cent quatre-vingts euros seulement.',
    'review': 'Et nos clients nous donnent cinq étoiles sur Google !',
    'cta': 'Pho Events : réservez votre date sur pho events point F R. Devis gratuit, réponse en vingt-quatre heures !',
}

# Ce que la transcription doit retrouver (sert à vérifier chaque prise)
EXPECT = {
    'formulas': 'le tout à partir de 180 euros seulement',
    'cta': 'faux évent réservez votre date sur faux évent fr devis gratuit réponse en 24 heures',
}
TRIES = 5
# Voix « qui accroche » : plus expressive (exaggeration haute) et plus rythmée (cfg bas)
EXAGGERATION = 0.85
CFG = 0.35


def norm(t):
    return re.sub(r'[^a-zàâçéèêëîïôûùüÿœ0-9 ]', ' ', t.lower()).split()


def score(heard, expected):
    return difflib.SequenceMatcher(None, norm(heard), norm(expected)).ratio()


if __name__ == '__main__':
    ref = sys.argv[1]
    only = sys.argv[2:] or list(LINES)
    os.makedirs(OUT, exist_ok=True)
    model = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
    asr = WhisperModel('small', device='cpu', compute_type='int8')
    for key in only:
        best = None
        for attempt in range(TRIES):
            torch.manual_seed(attempt)
            wav = model.generate(LINES[key], language_id='fr', audio_prompt_path=ref, exaggeration=EXAGGERATION, cfg_weight=CFG, temperature=0.7)
            audio16 = torchaudio.functional.resample(wav, model.sr, 16000)[0].numpy()
            heard = ' '.join(seg.text for seg in asr.transcribe(audio16, language='fr')[0])
            sc = score(heard, EXPECT.get(key, LINES[key]))
            print(f'  {key} #{attempt}: {sc:.2f} « {heard.strip()} »', flush=True)
            if best is None or sc > best[0]:
                best = (sc, wav)
            if sc > 0.93:
                break
        path = os.path.join(OUT, f'{key}.wav')
        raw = os.path.join(OUT, f'{key}.raw.wav')
        torchaudio.save(raw, best[1], model.sr)
        # volume homogène + coupe des basses inutiles, en 48 kHz
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5', '-ar', '48000', path], check=True)
        os.remove(raw)
        print(f'{key}: {best[1].shape[1] / model.sr:.2f}s (score {best[0]:.2f})', flush=True)

    # durées (en secondes) lues par la vidéo pour caler les scènes et baisser la musique
    durations = {}
    for key in LINES:
        f = os.path.join(OUT, f'{key}.wav')
        if os.path.exists(f):
            info = torchaudio.info(f)
            durations[key] = round(info.num_frames / info.sample_rate, 2)
    with open(os.path.join(OUT, 'durations.json'), 'w') as fh:
        json.dump(durations, fh, indent=2)
