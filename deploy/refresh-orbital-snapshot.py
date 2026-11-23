"""Refresh the dated, offline JPL Horizons context map. Serial requests follow SSD policy.
Geometric ICRF vectors, km, TDB. Body orientation uses the secular IAU PCK model;
periodic nutation/libration terms are omitted, so this is navigation context.
"""
from pathlib import Path
import argparse,datetime,json,re,time,urllib.parse,urllib.request
parser=argparse.ArgumentParser()
parser.add_argument('--epoch',default='2026-11-23',help='TDB calendar date, YYYY-MM-DD')
args=parser.parse_args();epoch=datetime.date.fromisoformat(args.epoch)
app=Path(__file__).resolve().parents[1]
ids={'sun':10,'mercury':199,'venus':299,'earth':399,'moon':301,'mars':499,'phobos':401,'deimos':402,'jupiter':599,'io':501,'europa':502,'ganymede':503,'callisto':504,'amalthea':505,'saturn':699,'mimas':601,'enceladus':602,'tethys':603,'dione':604,'rhea':605,'titan':606,'hyperion':607,'iapetus':608,'phoebe':609,'uranus':799,'miranda':705,'ariel':701,'umbriel':702,'titania':703,'oberon':704,'puck':715,'neptune':899,'triton':801,'nereid':802,'proteus':808,'pluto':999,'charon':901,'styx':905,'nix':902,'kerberos':904,'hydra':903,'ceres':2000001,'vesta':2000004,'ryugu':2162173}
pck_url='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc'
cache=app/'release/orbital-source-cache';cache.mkdir(parents=True,exist_ok=True)
pck_file=cache/'pck00011.tpc'
if not pck_file.exists():pck_file.write_bytes(urllib.request.urlopen(pck_url,timeout=30).read())
pck=pck_file.read_text();constants={}
for code,key,values in re.findall(r'BODY(\d+)_(POLE_RA|POLE_DEC|PM|RADII)\s*=\s*\((.*?)\)',pck,re.S):
 try:constants.setdefault(int(code),{})[key]=[float(v.replace('D','E').replace('d','e')) for v in values.split()]
 except ValueError:pass
jd=2440587.5+(epoch-datetime.date(1970,1,1)).days;days=jd-2451545.;centuries=days/36525
bodies={}
for id,code in ids.items():
 target=str(code) if code<2000000 else str(code-2000000)+';'
 params={'format':'json','COMMAND':"'"+target+"'",'EPHEM_TYPE':"'VECTORS'",'CENTER':"'500@0'",'TLIST':"'"+str(jd)+"'",'REF_PLANE':"'FRAME'",'REF_SYSTEM':"'ICRF'",'OUT_UNITS':"'KM-S'",'VEC_CORR':"'NONE'",'VEC_TABLE':"'2'",'CSV_FORMAT':"'YES'",'OBJ_DATA':"'NO'"}
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(params)
 file=cache/(id+'-'+args.epoch+'.json')
 if file.exists():result=json.loads(file.read_text())
 else:
  for attempt in range(3):
   try:result=json.load(urllib.request.urlopen(url,timeout=25));break
   except Exception:
    if attempt==2:raise
    time.sleep(1)
  file.write_text(json.dumps(result))
 text=result.get('result','');match=re.search(r'\$\$SOE\s*([^\n]+)',text)
 if not match:raise ValueError(id+': '+str(result.get('error',text[:200])))
 fields=match[1].split(',');position=[float(v) for v in fields[2:5]]
 if abs(float(fields[0])-jd)>1e-7:raise ValueError('Epoch mismatch: '+id)
 c=constants.get(code,{})
 # Small satellite shapes are schematized with their mean PCK radius.
 radii=c.get('RADII');radius=sum(radii)/len(radii) if radii else {'ryugu':.435,'styx':5.,'kerberos':6.,'nix':20.,'hydra':22.}.get(id)
 if radius is None:raise ValueError('Missing physical radius: '+id)
 rotation=None
 if all(k in c for k in ['POLE_RA','POLE_DEC','PM']):
  def poly(key,t):return sum(v*t**i for i,v in enumerate(c[key]))
  rotation={'ra':poly('POLE_RA',centuries),'dec':poly('POLE_DEC',centuries),'meridian':poly('PM',days)%360}
 bodies[id]={'horizonsId':target,'positionKm':position,'radiusKm':radius,'rotation':rotation}
 print('Fetched',id,flush=True)
output={'epoch':args.epoch+' 00:00:00 TDB','julianDateTdb':jd,'frame':'ICRF / solar-system barycenter; geometric vectors in km','orientation':'IAU secular PCK pole and prime meridian; periodic terms omitted','sources':[{'label':'JPL Horizons','url':'https://ssd.jpl.nasa.gov/horizons/'},{'label':'NAIF IAU orientation and radii','url':pck_url}],'bodies':bodies}
(app/'src/content/orbitalSnapshot.json').write_text(json.dumps(output,indent=2)+'\n')
print('Saved',len(bodies),'bodies at',output['epoch'])
