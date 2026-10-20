#!/bin/sh
# Funny Loisirs : rend la série (un MP4 9:16 par épisode, valable pour Instagram, TikTok, Snapchat, Facebook et stories)
# + une version sans musique (bruitages seuls, pour un son tendance ajouté dans l'appli) + une couverture,
# puis met le son à -14 LUFS.
# Prérequis : extraits préparés (yt-dlp sur le TikTok du client puis tools/build_clips.py).
# Usage : sh tools/render_series.sh [chemin/vers/chrome] [episode ...]
set -e
BROWSER=${1:+--browser-executable=$1}
[ $# -gt 0 ] && shift
D=videos/funnyloisirs/serie
mkdir -p $D $D/sans-musique
EPS=${*:-"avant-apres top3-anniversaire adultes coulisses"}
for ep in $EPS; do
  npx remotion render Serie-$ep $D/$ep.mp4 --crf=18 $BROWSER --log=error
  npx remotion render Serie-$ep-sans-musique $D/sans-musique/$ep.mp4 --crf=18 $BROWSER --log=error
  npx remotion still Serie-$ep $D/$ep-couverture.png --frame=20 $BROWSER --log=error
  sh tools/master_audio.sh $D/$ep.mp4 $D/sans-musique/$ep.mp4
done
echo "Série rendue."
