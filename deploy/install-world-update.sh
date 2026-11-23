#!/usr/bin/env bash
set -euo pipefail
bundle=$(cd -- "$(dirname -- "$0")" && pwd)
python3 "$bundle/verify-bundle.py"
[[ -x /opt/Overwatch/Overwatch && -f /opt/Overwatch/resources/app.asar ]] || { echo 'Installed Overwatch was not found.' >&2; exit 1; }
sudo -v
stamp=$(date -u +%Y%m%dT%H%M%SZ)
sudo cp -a /opt/Overwatch/resources/app.asar "/opt/Overwatch/resources/app.asar.before-worlds-$stamp"
sudo install -m 644 "$bundle/overwatch-app.asar" /opt/Overwatch/resources/app.asar.worlds-new
sudo mv /opt/Overwatch/resources/app.asar.worlds-new /opt/Overwatch/resources/app.asar
printf '%s\n' 'Installed world conditions, Earth filters, and nearby-world navigation. Close and reopen Overwatch.'
