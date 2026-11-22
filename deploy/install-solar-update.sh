#!/usr/bin/env bash
set -euo pipefail
bundle=$(cd -- "$(dirname -- "$0")" && pwd)
python3 "$bundle/verify-bundle.py"
if [[ ! -x /opt/Overwatch/Overwatch || ! -f /opt/Overwatch/resources/app.asar ]]; then
  echo 'The installed /opt/Overwatch application was not found.' >&2; exit 1
fi
# The working provider tunnel runs as root, whose SSH trust store already
# contains the verified Tailscale host. Reuse that account without accepting keys.
sudo -v
ssh_cmd=(sudo ssh -F /dev/null -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15)
remote_dir=$("${ssh_cmd[@]}" root@100.126.54.97 'mktemp -d /tmp/mayday-solar-update.XXXXXXXX')
if [[ ! "$remote_dir" =~ ^/tmp/mayday-solar-update\.[A-Za-z0-9]+$ ]]; then
  echo 'Unexpected remote staging path; no application files were changed.' >&2; exit 1
fi
"${ssh_cmd[@]}" root@100.126.54.97 "tar -xzf - -C '$remote_dir'" < "$bundle/merlin-solar-update.tar.gz"
"${ssh_cmd[@]}" root@100.126.54.97 "python3 '$remote_dir/apply-solar-backend.py' '$remote_dir'"
# Swap only the application payload, retaining runtime, sandbox permissions and credentials.
stamp=$(date -u +%Y%m%dT%H%M%SZ)
sudo cp -a /opt/Overwatch/resources/app.asar "/opt/Overwatch/resources/app.asar.before-solar-$stamp"
sudo install -m 644 "$bundle/overwatch-app.asar" /opt/Overwatch/resources/app.asar.solar-new
sudo mv /opt/Overwatch/resources/app.asar.solar-new /opt/Overwatch/resources/app.asar
printf '%s\n' 'Installed the solar atlas and submitted the MERLIN watch set.' 'Close and reopen Overwatch. Acquisition runs are staggered; data will arrive progressively.'
