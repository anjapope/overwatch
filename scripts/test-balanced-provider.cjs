const assert=require('node:assert/strict')
const fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const {collectBalancedProvider}=require('../build/electron/balanced-provider.cjs')
const {retainObservations,observationCounts,readObservationCache,writeObservationCache,newsSources}=require('../build/electron/observation-store.cjs')
const item=(id,source='overwatch-space-pds4')=>({document_id:id,protocol_version:'mayday.intelligence.document/1',source_id:source,storage_time:'2026-11-23T00:00:00Z'})
;(async()=>{
 const initial=[item('news-old',newsSources[0]),item('space-old')]
 const incoming=Array.from({length:6000},(_,i)=>item('space-'+i))
 const retained=retainObservations(initial,incoming)
 assert(retained.some(x=>x.document_id==='news-old'));assert.equal(observationCounts(retained).space,2500)
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'overwatch-cache-test-')),file=path.join(directory,'cache.json')
 try{writeObservationCache(file,retained);assert.equal(readObservationCache(file).length,retained.length);fs.writeFileSync(file,'broken');assert.deepEqual(readObservationCache(file),[])}finally{fs.rmSync(directory,{recursive:true,force:true})}
 const calls=[],progress=[]
 await collectBalancedProvider(new URL('https://example.test/documents?limit=100'),async url=>{
  const connector=url.searchParams.get('connector');calls.push(connector)
  return {items:[item(connector || 'new-space',connector || 'overwatch-space-pds4')],total:1}
 },initial,p=>progress.push(p))
 assert.deepEqual(calls.slice(0,4),[...newsSources]);assert.equal(progress.at(-1).collections.news,5);assert.equal(progress.at(-1).collections.space,2)
 assert.equal(progress[0].collections.cached,true);assert.equal(progress.at(-1).loadingMore,false)
 const failed=[]
 await collectBalancedProvider(new URL('https://example.test/documents'),async()=>{throw Error('offline')},initial,p=>failed.push(p))
 assert.equal(failed.at(-1).items.length,2);assert(failed.at(-1).error)
 // Byte-limited pages must follow their cursor even if fewer than 100 records fit.
 let pages=0
 await collectBalancedProvider(new URL('https://example.test/documents'),async url=>{
  if(url.searchParams.has('connector'))return {items:[],total:0}
  pages++;return {items:[item('partial-'+pages)],total:3,next_cursor:pages<3?'cursor-'+pages:null}
 },[],()=>{})
 assert.equal(pages,3)
 console.log('PASS: protected news quotas, persistent cache, independent cursors, partial pages, offline retention')
})().catch(e=>{console.error(e);process.exitCode=1})
