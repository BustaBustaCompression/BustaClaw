#!/usr/bin/env bash
# Install crewmesh for user tom. Prints each step; run only with Tom's OK.
# Usage: ./install.sh <node-name>    (pifive | tom-pi | nyuknyuk)
set -euo pipefail
NODE="${1:?node name}"
DEST=/home/tom/crewmesh
SRC="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST" ~/.config/crewmesh
cp "$SRC/crewmesh.py" "$DEST/"
if [ ! -f "$DEST/crewmesh.json" ]; then
  sed "s/\"node\": \"pifive\"/\"node\": \"$NODE\"/" "$SRC/crewmesh.example.json" > "$DEST/crewmesh.json"
  echo ">> edit $DEST/crewmesh.json: bind (tailscale ip -4), peers (drop $NODE, add the others)"
fi
if [ ! -f ~/.config/crewmesh/token ]; then
  echo ">> put the SAME shared token on all three boxes: ~/.config/crewmesh/token (chmod 600)"
  echo "   generate once with: python3 -c 'import secrets;print(secrets.token_urlsafe(32))'"
fi
echo ">> then: sudo cp $SRC/deploy/crewmesh.service /etc/systemd/system/ && sudo systemctl enable --now crewmesh"
