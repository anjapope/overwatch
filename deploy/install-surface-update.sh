#!/usr/bin/env bash
set -euo pipefail
bundle=$(cd -- "$(dirname -- "$0")" && pwd)
python3 "$bundle/verify-bundle.py"
[[ -x /opt/Overwatch/Overwatch && -f /opt/Overwatch/resources/app.asar ]] || { echo 'Installed Overwatch was not found.' >&2; exit 1; }
sudo -v
ssh_cmd=(sudo ssh -F /dev/null -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15)
remote_dir=$("${ssh_cmd[@]}" root@100.126.54.97 'mktemp -d /tmp/mayday-surface-update.XXXXXXXX')
[[ "$remote_dir" =~ ^/tmp/mayday-surface-update\.[A-Za-z0-9]+$ ]] || { echo 'Unexpected remote staging path.' >&2;exit 1; }
"${ssh_cmd[@]}" root@100.126.54.97 "tar -xzf - -C '$remote_dir'" < "$bundle/merlin-surface-update.tar.gz"
"${ssh_cmd[@]}" root@100.126.54.97 "python3 '$remote_dir/apply-surface-update.py' '$remote_dir'"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
sudo cp -a /opt/Overwatch/resources/app.asar "/opt/Overwatch/resources/app.asar.before-surface-$stamp"
sudo install -m 644 "$bundle/overwatch-app.asar" /opt/Overwatch/resources/app.asar.surface-new
sudo mv /opt/Overwatch/resources/app.asar.surface-new /opt/Overwatch/resources/app.asar
printf '%s\n' 'Installed scientific surface maps, Mars terrain, progressive loading, and faster PDS acquisition.' 'Close and reopen Overwatch. Select System, choose a supported body, then Open operations.'
