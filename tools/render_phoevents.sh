#!/bin/sh
# Pho Events : rend toutes les vidéos, rangées par réseau social, puis met le son à -14 LUFS.
# Usage : sh tools/render_phoevents.sh [chemin/vers/chrome]   (navigateur facultatif)
set -e
BROWSER=${1:+--browser-executable=$1}
R() { npx remotion render "$1" "$2" $BROWSER --log=error; }

mkdir -p videos/phoevents/instagram videos/phoevents/tiktok videos/phoevents/snapchat videos/phoevents/facebook videos/phoevents/bonus

R Instagram-Reel             videos/phoevents/instagram/reel.mp4
R Instagram-Reel-SansMusique videos/phoevents/instagram/reel-sans-musique.mp4
R Instagram-Story            videos/phoevents/instagram/story.mp4
R Feed-4x5                   videos/phoevents/instagram/post-4x5.mp4
R TikTok                     videos/phoevents/tiktok/tiktok.mp4
R TikTok-SansMusique         videos/phoevents/tiktok/tiktok-sans-musique.mp4
R Snapchat-Spotlight         videos/phoevents/snapchat/spotlight.mp4
R Snapchat-Story             videos/phoevents/snapchat/story.mp4
R Reel-VoixHomme             videos/phoevents/bonus/reel-voix-homme.mp4
R Intro                      videos/phoevents/bonus/intro-logo.mp4
npx remotion still Cover videos/phoevents/instagram/couverture.png --frame=80 $BROWSER --log=error

sh tools/master_audio.sh videos/phoevents/*/*.mp4

# Facebook : mêmes formats qu'Instagram (Reel 9:16, Story, post 4:5)
cp videos/phoevents/instagram/reel.mp4 videos/phoevents/facebook/reel.mp4
cp videos/phoevents/instagram/story.mp4 videos/phoevents/facebook/story.mp4
cp videos/phoevents/instagram/post-4x5.mp4 videos/phoevents/facebook/post-4x5.mp4
cp videos/phoevents/instagram/couverture.png videos/phoevents/tiktok/couverture.png
echo "Rendu terminé."
