# Vidéos réseaux sociaux — Pho Events & Funny Loisirs

Vidéos animées générées automatiquement avec [Remotion](https://www.remotion.dev), pour deux marques :
**Pho Events** (photobooth, phoevents.fr) et **Funny Loisirs** (structures gonflables, funnyloisirs.fr).

# Pho Events

## Vidéos prêtes (dossier `videos/phoevents/`, rangées par réseau)

Chaque version place le texte dans la **zone visible** du réseau (hors boutons, légende, barre de profil).

| Réseau | Fichier | Format | Où le publier |
|---|---|---|---|
| Instagram | `instagram/reel.mp4` | 9:16 · 27 s | Reel |
| Instagram | `instagram/reel-sans-musique.mp4` | 9:16 · 27 s | Reel avec un son tendance ajouté dans l'appli |
| Instagram | `instagram/story.mp4` | 9:16 · 17 s | Story (+ sticker Sondage 1/2/3/4) |
| Instagram | `instagram/post-4x5.mp4` | 4:5 · 27 s | Publication dans le fil |
| Instagram | `instagram/couverture.png` | 9:16 | Couverture du Reel |
| TikTok | `tiktok/tiktok.mp4` | 9:16 · 27 s | Vidéo TikTok |
| TikTok | `tiktok/tiktok-sans-musique.mp4` | 9:16 · 27 s | Avec un son tendance TikTok |
| Snapchat | `snapchat/spotlight.mp4` | 9:16 · 27 s | Spotlight |
| Snapchat | `snapchat/story.mp4` | 9:16 · 17 s | Story |
| Facebook | `facebook/reel.mp4`, `story.mp4`, `post-4x5.mp4` | 9:16 / 4:5 | Reel, Story, fil |
| Bonus | `bonus/reel-voix-homme.mp4`, `bonus/intro-logo.mp4` | 9:16 / 16:9 | Variante voix d'homme, intro logo |

Concept « Tu choisis lequel ? » : accroche → 4 cadres d'exemple numérotés (mariage, anniversaire, baby shower,
entreprise) → récap des 4 + « Commente ton numéro 👇 » (pour faire réagir en commentaires) → tirage imprimé sur place →
prix, avis Google, appel à l'action. Toutes les coupes tombent sur les temps de la musique (117 BPM).

Musique : « Funky Chunk » de Kevin MacLeod (incompetech.com), licence CC BY 4.0 :
**mettre en description de la publication** « Musique : Funky Chunk – Kevin MacLeod (incompetech.com) – CC BY 4.0 ».
Son final mis à -14 LUFS (`tools/master_audio.sh`). Bruitages originaux générés par `tools/make_audio.py`.

## Modifier les textes / couleurs

Tout est dans `src/config.ts` (section `reel` : accroche, cadres, prix, appel à l'action ; section `music`).
Le logo est dans `public/logo.png`, la musique et les bruitages dans `public/audio/`.

## Régénérer les vidéos

```bash
npm install
npm run render:all     # les deux marques (ou render:phoevents / render:funny)
npm run studio         # aperçu en direct dans le navigateur
```

## Modifier la voix off

Les phrases sont dans `tools/make_voice.py` (dictionnaire `LINES`). La vidéo s'adapte toute seule à leur durée.

```bash
pip install chatterbox-tts faster-whisper
python tools/make_voice.py voix-reference.wav          # toutes les phrases
python tools/make_voice.py voix-reference.wav cta      # une seule phrase
```

`voix-reference.wav` : 5 à 10 s d'une voix française dont on copie le timbre et l'accent.

## Effacer les personnes d'une photo

`tools/remove_people.py` détoure les personnes (rembg) puis reconstruit le décor (LaMa) :

```bash
pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
pip install -r tools/requirements.txt
python tools/remove_people.py photo.jpg photo-vide.jpg --shadow
```

# Funny Loisirs

Reel « POV : t'as transformé ton jardin 🤯 » (~18 s, 117 BPM) : les **vraies photos** des structures en plein écran,
coupes sur le rythme avec gros sous-titres (LEGO géante dès 450 €, Château Safari World dès 280 €, toboggan géant,
parcours d'obstacles, bubble foot, lancer de hache, cible foot géante, Puissance 4 basket dès 180 €) →
« Et toi ? Tu profites 😎 » (livraison & installation, matériel nettoyé & contrôlé, 5/5 · 25 avis Google) →
« Réserve ton week-end 🎉 », site, téléphone, devis gratuit 24h.

Fichiers dans `videos/funnyloisirs/` : mêmes formats et mêmes noms que pour Pho Events (instagram/reel, reel-sans-musique,
story ~13 s, post-4x5, couverture ; tiktok ; snapchat ; facebook).

Musique : « Who Likes to Party » de Kevin MacLeod (incompetech.com), licence CC BY 4.0 : **mettre en description**
« Musique : Who Likes to Party – Kevin MacLeod (incompetech.com) – CC BY 4.0 ».

Modifier : `src/funny/promo.tsx` (plans, textes, prix) et `src/funny/config.ts` (contact, musique). Photos : `public/funny/photos/`.
