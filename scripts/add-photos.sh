#!/bin/sh
# Кладёт два присланных кадра в проект: станции зарядки и герой «Вопросов».
# Принимает любые форматы (png/jpg/webp), перекодирует в AVIF теми же
# параметрами, что и остальные снимки сайта, и пересобирает страницы.
#
#   sh scripts/add-photos.sh ~/Downloads/stations.png ~/Downloads/faq.png
#
# Любой аргумент можно пропустить, поставив вместо пути дефис: - 
set -e
cd "$(dirname "$0")/.."

enc() { # enc <исходник> <куда>
  [ "$1" = "-" ] && return 0
  [ -f "$1" ] || { echo "нет файла: $1" >&2; exit 1; }
  ffmpeg -v error -y -i "$1" -c:v libsvtav1 -preset 4 -crf 36 -pix_fmt yuv420p "$2" 2>/dev/null
  printf '%-38s %sK\n' "$2" "$(( $(stat -f%z "$2") / 1024 ))"
}

enc "${1:--}" assets/business/stations.avif
enc "${2:--}" assets/business/faq-hero.avif

node scripts/build-pages.mjs >/dev/null
echo "страницы пересобраны"
