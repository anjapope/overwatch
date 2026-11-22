from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
for name,expected in json.loads((root/'checksums.json').read_text()).items():
    actual=hashlib.sha256((root/name).read_bytes()).hexdigest()
    if actual!=expected:raise SystemExit('Bundle checksum mismatch: '+name)
print('Bundle checksums verified.')
