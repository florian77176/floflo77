#!/bin/sh
# Funny Loisirs : rend toutes les vidéos, rangées par réseau social, puis met le son à -14 LUFS.
# Usage : sh tools/render_funny.sh [chemin/vers/chrome]   (navigateur facultatif)
set -e
BROWSER=${1:+--browser-executable=$1}
R() { npx remotion render "$1" "$2" $BROWSER --log=error; }
D=videos/funnyloisirs

mkdir -p $D/instagram $D/tiktok $D/snapchat $D/facebook

R Funny-Instagram-Reel             $D/instagram/reel.mp4
R Funny-Instagram-Reel-SansMusique $D/instagram/reel-sans-musique.mp4
R Funny-Instagram-Story            $D/instagram/story.mp4
R Funny-Feed-4x5                   $D/instagram/post-4x5.mp4
R Funny-TikTok                     $D/tiktok/tiktok.mp4
R Funny-TikTok-SansMusique         $D/tiktok/tiktok-sans-musique.mp4
R Funny-Snapchat-Spotlight         $D/snapchat/spotlight.mp4
R Funny-Snapchat-Story             $D/snapchat/story.mp4
npx remotion still Funny-Cover $D/instagram/couverture.png --frame=45 $BROWSER --log=error

sh tools/master_audio.sh $D/*/*.mp4

# Facebook : mêmes formats qu'Instagram
cp $D/instagram/reel.mp4 $D/facebook/reel.mp4
cp $D/instagram/story.mp4 $D/facebook/story.mp4
cp $D/instagram/post-4x5.mp4 $D/facebook/post-4x5.mp4
cp $D/instagram/couverture.png $D/tiktok/couverture.png
echo "Rendu Funny Loisirs terminé."
