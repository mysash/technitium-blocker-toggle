#!/usr/bin/env bash
# Baut dist/chrome und dist/firefox inkl. ZIP-Paketen.
set -euo pipefail
cd "$(dirname "$0")"

# sed statt grep -oP: BSD-grep (macOS) kennt kein -P
ver() { sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$1" | head -1; }
vc=$(ver platform/chrome/manifest.json)
vf=$(ver platform/firefox/manifest.json)
[[ "$vc" == "$vf" ]] || { echo "Versionskonflikt: chrome=$vc firefox=$vf" >&2; exit 1; }

rm -rf dist && mkdir -p dist
for p in chrome firefox; do
  mkdir -p "dist/$p"
  cp -r src/. "dist/$p/"
  cp "platform/$p/manifest.json" "dist/$p/"
  (cd "dist/$p" && zip -qr "../technitium-blocker-$p-$vc.zip" .)
done
echo "Version $vc gebaut:" && ls -1 dist/*.zip
