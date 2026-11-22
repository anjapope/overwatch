from pathlib import Path
import hashlib,json,struct,tarfile,shutil,subprocess
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--live-source',type=Path)
args=parser.parse_args()
app=Path(__file__).resolve().parents[1]
backend=app.parent/'mayday-intelligence'
snapshot=json.loads(args.live_source.read_text()) if args.live_source else None
out=app/'release/solar-update';out.mkdir(parents=True,exist_ok=True)
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
changed=['src/mayday_intelligence/config.py','src/mayday_intelligence/service.py','src/mayday_intelligence/management_config.py','src/mayday_intelligence/core/execution.py','src/mayday_intelligence/connectors/pds.py']
manifest={}
for relative in changed:
 try:previous=subprocess.check_output(['git','-C',str(backend),'show','HEAD:'+relative],stderr=subprocess.DEVNULL)
 except subprocess.CalledProcessError:previous=None
 if snapshot and snapshot['files'].get(relative) is not None:
  observed=snapshot['files'][relative]
  observed_bytes=observed['content'].encode()
  if hashlib.sha256(observed_bytes).hexdigest()!=observed['sha256']:
   raise SystemExit('Snapshot hash mismatch: '+relative)
  if previous is None or previous.rstrip(b'\n')!=observed_bytes.rstrip(b'\n'):
   raise SystemExit('Functional source difference requires a reviewed merge: '+relative)
  previous=observed_bytes
 manifest[relative]={'before':None if previous is None else hashlib.sha256(previous).hexdigest(),'after':hashlib.sha256((backend/relative).read_bytes()).hexdigest()}
manifest_path=out/'backend-patch.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
with tarfile.open(out/'merlin-solar-update.tar.gz','w:gz') as tar:
 tar.add(manifest_path,arcname='backend-patch.json')
 for relative in changed:tar.add(backend/relative,arcname='patch/'+relative)
 for folder in ['config/space','config/sources','config/watches']:
  for path in (backend/folder).glob('*'):
   if path.is_file() and (folder=='config/space' or path.name.startswith('overwatch-space-')):tar.add(path,arcname=str(path.relative_to(backend)))
 for relative in ['scripts/submit-space-requests.py','tests/test_pds_catalog_unittest.py']:tar.add(backend/relative,arcname=relative)
 tar.add(backend/'scripts/apply-solar-backend.py',arcname='apply-solar-backend.py')
for name in ['install-solar-update.sh','verify-bundle.py']:shutil.copy2(app/'deploy'/name,out/name)
checksums={name:hashlib.sha256((out/name).read_bytes()).hexdigest() for name in ['overwatch-app.asar','merlin-solar-update.tar.gz','verify-bundle.py']}
(out/'checksums.json').write_text(json.dumps(checksums,indent=2)+'\n')
print('Packaged and round-trip verified',len(entries),'application files;',archive.stat().st_size,'bytes')
print('Installer:',out/'install-solar-update.sh')
