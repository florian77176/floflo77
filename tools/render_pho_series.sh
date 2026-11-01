#!/bin/sh
# Pho Events : rend la série « vrais modèles de cadres » (un MP4 9:16 par épisode pour tous les réseaux)
# + version sans musique + couverture, puis met le son à -14 LUFS.
# Usage : sh tools/render_pho_series.sh [chemin/vers/chrome] [--sans-musique] [episode ...]
set -e
BROWSER=${1:+--browser-executable=$1}
[ $# -gt 0 ] && shift
SM=0
[ "$1" = "--sans-musique" ] && SM=1 && shift
D=videos/phoevents/serie
mkdir -p $D $D/sans-musique
EPS=${*:-"choisis-ton-cadre mariage-2027 anniversaire chaque-moment"}
for ep in $EPS; do
  if [ $SM = 1 ]; then
    npx remotion render Pho-$ep-sans-musique $D/sans-musique/$ep.mp4 --crf=18 $BROWSER --log=error
    sh tools/master_audio.sh $D/sans-musique/$ep.mp4
  else
    npx remotion render Pho-$ep $D/$ep.mp4 --crf=18 $BROWSER --log=error
    npx remotion still Pho-$ep $D/$ep-couverture.png --frame=20 $BROWSER --log=error
    sh tools/master_audio.sh $D/$ep.mp4
  fi
done
echo "Série Pho Events rendue."
