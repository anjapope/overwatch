from pathlib import Path
import hashlib,json,struct,shutil,argparse
app=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--bundle-name',choices=['viewer-update','profile-update'],default='viewer-update')
parser.add_argument('--installer',choices=['install-viewer-update.sh','install-profile-update.sh'],default='install-viewer-update.sh')
args=parser.parse_args()
out=app/'release'/args.bundle_name;out.mkdir(parents=True,exist_ok=True)
files=[p for d in ['build/electron','dist'] for p in (app/d).rglob('*') if p.is_file()]+[app/'package.json']
tree={'files':{}};offset=0;entries=[]
for p in sorted(files):
 data=p.read_bytes();relative=p.relative_to(app);node=tree
 for part in relative.parts[:-1]:node=node['files'].setdefault(part,{'files':{}})
 node['files'][relative.name]={'size':len(data),'offset':str(offset),'integrity':{'algorithm':'SHA256','hash':hashlib.sha256(data).hexdigest(),'blockSize':4194304,'blocks':[hashlib.sha256(data[i:i+4194304]).hexdigest() for i in range(0,len(data),4194304)]}}
 entries.append((p,data));offset+=len(data)
encoded=json.dumps(tree,separators=(',',':'),ensure_ascii=False).encode();padded=encoded+b'\0'*((-len(encoded))%4)
header=struct.pack('<II',len(padded)+4,len(encoded))+padded
archive=out/'overwatch-app.asar'
with archive.open('wb') as f:
 f.write(struct.pack('<II',4,len(header)));f.write(header)
 for p,data in entries:f.write(data)
# Round-trip every archive file and verify its hash before creating the installer bundle.
with archive.open('rb') as f:
 sizes=struct.unpack('<4I',f.read(16));loaded=json.loads(f.read(sizes[3]));base=8+sizes[1]
 for p,data in entries:
  node=loaded
  for part in p.relative_to(app).parts:node=node['files'][part]
  f.seek(base+int(node['offset']));assert f.read(node['size'])==data,p
for name in [args.installer,'verify-bundle.py']:shutil.copy2(app/'deploy'/name,out/name)
checksums={name:hashlib.sha256((out/name).read_bytes()).hexdigest() for name in ['overwatch-app.asar','verify-bundle.py']}
(out/'checksums.json').write_text(json.dumps(checksums,indent=2)+'\n')
print('Verified',len(entries),'application files;',archive.stat().st_size,'bytes')
print(out/args.installer)
