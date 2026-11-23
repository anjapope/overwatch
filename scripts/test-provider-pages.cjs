const assert = require('node:assert/strict')
const {collectProviderPages} = require('../build/electron/provider-pages.cjs')
const item = id => ({document_id:id,protocol_version:'mayday.intelligence.document/1'})
const url = new URL('https://example.test/api/v1/provider/documents?limit=100')
;(async()=>{
 const urls=[]
 const result=await collectProviderPages(url,async value=>{urls.push(value.toString());return urls.length===1?{items:[item('first')],total:2,next_cursor:'first'}:{items:[item('second')],total:1,next_cursor:'second'}})
 assert.deepEqual(result.items.map(i=>i.document_id),['first','second']);assert.equal(new URL(urls[1]).searchParams.get('cursor'),'first');assert.equal(result.truncated,false)
 assert.equal((await collectProviderPages(url,async()=>({items:[item('first')],total:10,next_cursor:'first'}),1)).truncated,true)
 await assert.rejects(collectProviderPages(url,async()=>({items:[item('first')],total:10,next_cursor:'first'})),/did not advance/)
 for(const page of [null,{}, {items:[{document_id:'x'}],total:1}]) await assert.rejects(collectProviderPages(url,async()=>page))
 const progress=[]
 let release
 let calls=0
 const stream=collectProviderPages(url,async()=>{
  calls++
  if(calls===1)return {items:[item('immediate')],total:2,next_cursor:'immediate'}
  return await new Promise(resolve=>{release=resolve})
 },50,page=>progress.push(page))
 await new Promise(resolve=>setImmediate(resolve))
 assert.equal(progress.length,1);assert.equal(progress[0].loadingMore,true);assert.equal(progress[0].items[0].document_id,'immediate')
 release({items:[item('later')],total:1,next_cursor:'later'})
 await stream
 assert.equal(progress.at(-1).loadingMore,false);assert.equal(progress.at(-1).items.length,2)
 console.log('PASS: pagination, progressive first-page display, bounded results, repeated cursors, invalid contracts')
})().catch(error=>{console.error(error);process.exitCode=1})
