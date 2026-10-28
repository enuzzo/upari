#!/bin/sh
# Spacing QA over the screens with text, in every language, at one viewport: prints the
# tightest ink gaps (px) measured by gaps.js. W, H, DPR and MOBILE pass through to shots.mjs.
#   W=1280 H=800 sh tools/qa/spacing.sh http://127.0.0.1:4181 /tmp/out [langs...]
url=$1; out=$2; shift 2
langs=${*:-it en es fr de pt ru zh ja ko ar hi}
G="$(cat "$(dirname "$0")/gaps.js")"
set --
for l in $langs; do
  set -- "$@" "eval:localStorage.setItem('upari.born','1985'); location.href='/?lang=$l'" wait:5 "eval:'$l home     '+$G" \
    "eval:upari.jump(upari.director.storyById('natura').chapters.findIndex(c=>c.id==='acido'),'natura')" wait:3 adv:18 wait:2 "eval:'$l chapter  '+$G" \
    "eval:upari.director.openDrawer()" wait:2 "eval:'$l drawer   '+$G" "eval:upari.director.closeDrawer()" wait:1 \
    "eval:upari.director.showPlace(12.5, 41.9, 'Roma', 'Lazio, Italia')" wait:4 "eval:'$l place    '+$G" \
    "eval:document.dispatchEvent(new KeyboardEvent('keydown',{key:'l'}))" wait:2 "eval:'$l explore  '+$G" \
    "shot:$l"
done
node "$(dirname "$0")/../shots.mjs" "$url/?lang=it" "$out" wait:3 "$@" 2>&1 | grep -E '^[a-z]{2} '
