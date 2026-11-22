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
 console.log('PASS: provider pagination, bounded results, repeated cursors, invalid contracts')
})().catch(error=>{console.error(error);process.exitCode=1})
