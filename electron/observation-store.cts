import fs from 'node:fs'
import path from 'node:path'
export interface StoredObservation { document_id:string; protocol_version:string; source_id?:string|null; connector_id?:string|null; source_type?:string|null; storage_time?:string; publication_time?:string|null; [key:string]:unknown }
export const newsSources=['overwatch-bbc-world','overwatch-bbc-business','overwatch-un-news','overwatch-govuk'] as const
export const CACHE_BYTES=24*1024*1024
export function collectionFor(item:StoredObservation):string {
  const source=item.source_id ?? item.connector_id ?? ''
  if(newsSources.some(id=>id===source))return source
  if(source.startsWith('overwatch-space-') || item.source_type==='pds')return 'space'
  return 'other'
}
const stamp=(item:StoredObservation)=>Date.parse(item.publication_time || item.storage_time || '') || 0
export function retainObservations(previous:StoredObservation[],incoming:StoredObservation[]):StoredObservation[] {
  const records=new Map(previous.map(item=>[item.document_id,item]))
  for(const item of incoming)records.set(item.document_id,item)
  const counts=new Map<string,number>();let bytes=2
  // Reserve independent quotas and disk budgets: archive volume cannot evict news.
  const groups=[...newsSources,'other','space']
  const sorted=[...records.values()].sort((a,b)=>stamp(b)-stamp(a)||a.document_id.localeCompare(b.document_id))
  const kept:StoredObservation[]=[]
  for(const group of groups){
    let groupBytes=0
    const quota=group==='space'?2500:group==='other'?1000:250
    const budget=group==='space'?12*1024*1024:group==='other'?4*1024*1024:2*1024*1024
    for(const item of sorted){
      if(collectionFor(item)!==group || (counts.get(group)??0)>=quota)continue
      const size=Buffer.byteLength(JSON.stringify(item))+1
      if(groupBytes+size>budget || bytes+size>CACHE_BYTES)continue
      groupBytes+=size;bytes+=size;counts.set(group,(counts.get(group)??0)+1);kept.push(item)
    }
  }
  return kept.sort((a,b)=>stamp(b)-stamp(a)||a.document_id.localeCompare(b.document_id))
}
export function observationCounts(items:StoredObservation[]) {
  let news=0,space=0,other=0
  for(const item of items){const group=collectionFor(item);if(group==='space')space++;else if(group==='other')other++;else news++}
  return {news,space,other}
}
export function readObservationCache(file:string):StoredObservation[] {
  try {
    if(fs.statSync(file).size>CACHE_BYTES+1024)return []
    const data=JSON.parse(fs.readFileSync(file,'utf8'))
    if(data.version!==1 || !Array.isArray(data.items))return []
    return retainObservations([],data.items.filter((item:StoredObservation)=>item && typeof item.document_id==='string' && item.protocol_version==='mayday.intelligence.document/1'))
  } catch{return []}
}
export function writeObservationCache(file:string,items:StoredObservation[]) {
  const payload=JSON.stringify({version:1,savedAt:new Date().toISOString(),items:retainObservations([],items)})
  fs.mkdirSync(path.dirname(file),{recursive:true})
  const temporary=file+'.new';fs.writeFileSync(temporary,payload,{mode:0o600});fs.renameSync(temporary,file)
}
