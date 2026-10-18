#!/bin/sh
# Rend toutes les vidéos des deux marques. Usage : sh tools/render_all.sh [chemin/vers/chrome]
set -e
sh tools/render_phoevents.sh "$@"
sh tools/render_funny.sh "$@"
