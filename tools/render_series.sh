#!/bin/sh
# Funny Loisirs : rend la série (un MP4 9:16 par épisode, valable pour Instagram, TikTok, Snapchat, Facebook et stories)
# + une version sans musique (bruitages seuls, pour un son tendance ajouté dans l'appli) + une couverture,
# puis met le son à -14 LUFS.
# Prérequis : extraits préparés (yt-dlp sur le TikTok du client puis tools/build_clips.py).
# Usage : sh tools/render_series.sh [chemin/vers/chrome] [--avec-musique|--sans-musique] [episode ...]
set -e
BROWSER=${1:+--browser-executable=$1}
[ $# -gt 0 ] && shift
MODE=both
case "$1" in --avec-musique) MODE=music; shift;; --sans-musique) MODE=nomusic; shift;; esac
D=videos/funnyloisirs/serie
mkdir -p $D $D/sans-musique
EPS=${*:-"avant-apres top3-anniversaire adultes coulisses faq-pluie fetes-entreprise combien-ca-coute pov-parents animal-land-19s faq-place lego-geante"}
for ep in $EPS; do
  if [ $MODE != nomusic ]; then
    npx remotion render Serie-$ep $D/$ep.mp4 --crf=18 $BROWSER --log=error
    npx remotion still Serie-$ep $D/$ep-couverture.png --frame=20 $BROWSER --log=error
    sh tools/master_audio.sh $D/$ep.mp4
  fi
  if [ $MODE != music ]; then
    npx remotion render Serie-$ep-sans-musique $D/sans-musique/$ep.mp4 --crf=18 $BROWSER --log=error
    sh tools/master_audio.sh $D/sans-musique/$ep.mp4
  fi
done
echo "Série rendue."
