#!/bin/sh
# Rend toutes les vidéos, rangées par réseau social, puis met le son à -14 LUFS.
# Usage : sh tools/render_all.sh [chemin/vers/chrome]   (navigateur facultatif)
set -e
BROWSER=${1:+--browser-executable=$1}
R() { npx remotion render "$1" "$2" $BROWSER --log=error; }

mkdir -p videos/instagram videos/tiktok videos/snapchat videos/facebook videos/bonus

R Instagram-Reel             videos/instagram/reel.mp4
R Instagram-Reel-SansMusique videos/instagram/reel-sans-musique.mp4
R Instagram-Story            videos/instagram/story.mp4
R Feed-4x5                   videos/instagram/post-4x5.mp4
R TikTok                     videos/tiktok/tiktok.mp4
R TikTok-SansMusique         videos/tiktok/tiktok-sans-musique.mp4
R Snapchat-Spotlight         videos/snapchat/spotlight.mp4
R Snapchat-Story             videos/snapchat/story.mp4
R Reel-VoixHomme             videos/bonus/reel-voix-homme.mp4
R Intro                      videos/bonus/intro-logo.mp4
npx remotion still Cover videos/instagram/couverture.png --frame=80 $BROWSER --log=error

sh tools/master_audio.sh videos/*/*.mp4

# Facebook : mêmes formats qu'Instagram (Reel 9:16, Story, post 4:5)
cp videos/instagram/reel.mp4 videos/facebook/reel.mp4
cp videos/instagram/story.mp4 videos/facebook/story.mp4
cp videos/instagram/post-4x5.mp4 videos/facebook/post-4x5.mp4
cp videos/instagram/couverture.png videos/tiktok/couverture.png
echo "Rendu terminé."
