#!/bin/sh
# Met le son des vidéos au niveau standard des réseaux sociaux (-14 LUFS), sans réencoder l'image.
# Usage : sh tools/master_audio.sh videos/*.mp4
for f in "$@"; do
  ffmpeg -loglevel error -y -i "$f" -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 192k "$f.tmp.mp4" && mv "$f.tmp.mp4" "$f"
  echo "ok $f"
done
