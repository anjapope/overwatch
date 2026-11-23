#!/usr/bin/env bash
set -euo pipefail
bundle=$(cd -- "$(dirname -- "$0")" && pwd)
sudo -v
snapshot="$bundle/live-source.json"
sudo ssh -F /dev/null -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 root@100.126.54.97 python3 - > "$snapshot.tmp" <<'PY'
import hashlib,json,subprocess
from pathlib import Path
root=Path(subprocess.check_output(['systemctl','show','mayday-intelligence.service','--property=WorkingDirectory','--value'],text=True).strip())
if not root.is_absolute() or not (root/'src/mayday_intelligence/service.py').is_file():
    raise SystemExit('Could not identify the deployed source directory')
paths=['src/mayday_intelligence/config.py','src/mayday_intelligence/service.py','src/mayday_intelligence/management_config.py','src/mayday_intelligence/core/execution.py','src/mayday_intelligence/connectors/pds.py']
files={}
for relative in paths:
    path=root/relative
    files[relative]=None if not path.is_file() else {'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'content':path.read_text()}
print(json.dumps({'source_root':str(root),'files':files},indent=2))
PY
python3 - "$snapshot.tmp" <<'PY'
import json,sys
with open(sys.argv[1]) as stream:data=json.load(stream)
assert isinstance(data.get('files'),dict) and len(data['files'])==5
print('Source snapshot collected. No remote files or services were changed.')
PY
mv "$snapshot.tmp" "$snapshot"
chmod 600 "$snapshot"
printf 'Saved: %s\n' "$snapshot"
