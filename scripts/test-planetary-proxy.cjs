const assert=require('node:assert/strict')
const fs=require('node:fs')
const {planetaryUpstream,createPlanetaryProxy}=require('../build/electron/planetary-proxy.cjs')
const layers=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../public/planetary-layers.json'))).layers
;(async()=>{
 const l=layers[0],path=`/planetary/tiles/${l.id}/0/1/0`
 assert.equal(new URL(planetaryUpstream(path,layers)).hostname,'trek.nasa.gov')
 for(const invalid of ['/planetary/tiles/../../private','/planetary/tiles/unknown/0/0/0',`/planetary/tiles/${l.id}/30/0/0`,`/planetary/tiles/${l.id}/0/2/0`,'/planetary/terrain/mars/8/0/0']) assert.equal(planetaryUpstream(invalid,layers),undefined)
 let calls=0
 const proxy=createPlanetaryProxy(layers,async()=>{calls++;return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}})})
 assert.equal((await proxy(path)).status,200);assert.equal((await proxy(path)).status,200);assert.equal(calls,1)
 assert.equal((await proxy('/planetary/tiles/unknown/0/0/0')).status,404)
 const bad=createPlanetaryProxy(layers,async()=>new Response('<error/>',{headers:{'content-type':'application/xml'}}))
 assert.equal((await bad(path)).status,502)
 console.log('PASS: planetary URL allowlist, published zoom bounds, caching, and invalid imagery rejection')
})().catch(error=>{console.error(error);process.exitCode=1})
