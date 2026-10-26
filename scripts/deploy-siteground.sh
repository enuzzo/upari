#!/usr/bin/env bash
# Publish the build on SiteGround (upari.earth) over FTPS, sending only what changed.
#
# The server keeps a list of the published files with their sha256 (.deploy-manifest, not
# served: see public/.htaccess). Every run compares it with the new build, uploads the new
# and changed files, index.html last so a visitor never gets a page whose files are not
# there yet, then removes the files that left the build. Anything else in public_html
# (.well-known, files put there by hand) is never touched.
#
# Needs lftp and DEPLOY_HOST, DEPLOY_PORT, DEPLOY_USER, DEPLOY_PASSWORD, DEPLOY_PATH
# (the folder of the site seen from the FTP account, "/" when the account opens in public_html).
# Usage: scripts/deploy-siteground.sh [dist]   (DRY_RUN=1 prints the plan and sends nothing)
set -euo pipefail

dist=${1:-dist}
[ -f "$dist/index.html" ] || { echo "No build in $dist" >&2; exit 1; }
remote="${DEPLOY_PATH%/}/"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
export LFTP_PASSWORD="$DEPLOY_PASSWORD"

connect="set ftp:ssl-force true; set ftp:ssl-protect-data true; set ssl:verify-certificate true
set net:max-retries 3; set net:timeout 30; set net:reconnect-interval-base 5
open --env-password -u \"$DEPLOY_USER\" -p $DEPLOY_PORT \"$DEPLOY_HOST\""

# What the build contains, and what the server says it has (nothing on the first run).
(cd "$dist" && find . -type f -print0 | sort -z | xargs -0 shasum -a 256) | sed 's#  \./#  #' > "$work/new"
printf '%s\nget -e "%s.deploy-manifest" -o "%s/old"\nbye\n' "$connect" "$remote" "$work" > "$work/fetch.lftp"
lftp -f "$work/fetch.lftp" >/dev/null 2>&1 || : > "$work/old"
[ -f "$work/old" ] || : > "$work/old"

# sha256 is 64 characters plus two spaces: the path starts at column 67.
comm -13 <(sort "$work/old") <(sort "$work/new") | cut -c67- | sort > "$work/changed"
comm -23 <(cut -c67- "$work/old" | sort) <(cut -c67- "$work/new" | sort) > "$work/removed"

{
  echo "$connect"
  dirs=""
  while read -r p; do
    [ -n "$p" ] && [ "$p" != index.html ] || continue
    d=$(dirname "$p")
    if [ "$d" = . ]; then d=""; else
      case " $dirs " in *" $d "*) ;; *) dirs="$dirs $d"; echo "mkdir -p -f \"$remote$d\"" ;; esac
      d="$d/"
    fi
    echo "put -O \"$remote$d\" \"$dist/$p\""
  done < "$work/changed"
  if grep -qx 'index.html' "$work/changed"; then echo "put -O \"$remote\" \"$dist/index.html\""; fi
  while read -r p; do [ -z "$p" ] || echo "rm -f \"$remote$p\""; done < "$work/removed"
  echo "put \"$work/new\" -o \"$remote.deploy-manifest\""
  echo bye
} > "$work/publish.lftp"

echo "Changed: $(wc -l < "$work/changed" | tr -d ' ') of $(wc -l < "$work/new" | tr -d ' ') files · removed: $(wc -l < "$work/removed" | tr -d ' ')"
if [ "${DRY_RUN:-}" = 1 ]; then sed '/^open /d' "$work/publish.lftp"; exit 0; fi
lftp -f "$work/publish.lftp"
echo "Published on $DEPLOY_HOST:$remote"
