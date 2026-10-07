#!/usr/bin/env bash
# Builds dist/chrome and dist/firefox including the ZIP packages.
set -euo pipefail
cd "$(dirname "$0")"

# sed instead of grep -oP: BSD grep (macOS) has no -P
ver() { sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$1" | head -1; }
vc=$(ver platform/chrome/manifest.json)
vf=$(ver platform/firefox/manifest.json)
[[ "$vc" == "$vf" ]] || { echo "Version mismatch: chrome=$vc firefox=$vf" >&2; exit 1; }

rm -rf dist && mkdir -p dist
for p in chrome firefox; do
  mkdir -p "dist/$p"
  cp -r src/. "dist/$p/"
  cp "platform/$p/manifest.json" "dist/$p/"
  (cd "dist/$p" && zip -qr "../technitium-blocker-$p-$vc.zip" .)
done
echo "Built version $vc:" && ls -1 dist/*.zip
