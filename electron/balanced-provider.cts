import { newsSources, observationCounts, retainObservations, type StoredObservation } from './observation-store.cjs'
export interface BalancedProgress { items:StoredObservation[]; total:number; truncated:boolean; loadingMore:boolean; error?:string; collections:{news:number;space:number;other:number;cached:boolean;warnings:string[]} }
/** Round-robin independent cursors so archive backfill cannot starve existing news. */
export async function collectBalancedProvider(firstUrl:URL,read:(url:URL)=>Promise<unknown>,previous:StoredObservation[],onProgress:(page:BalancedProgress)=>void) {
  const lanes=[...newsSources.map(source=>({name:source,connector:source,maxPages:3})),{name:'general archive',connector:undefined,maxPages:25}].map(lane=>({...lane,cursor:undefined as string|undefined,pages:0,loaded:0,total:undefined as number|undefined,done:false,seen:new Set<string>(),failed:false}))
  let items=retainObservations(previous,[]),received=0,bounded=false
  const warnings:string[]=[]
  const emit=(loadingMore:boolean)=>{
    const page:BalancedProgress={items:[...items],total:Math.max(items.length,lanes.at(-1)?.total??0),truncated:bounded,loadingMore,collections:{...observationCounts(items),cached:received===0 && previous.length>0,warnings:[...warnings]}}
    if(!loadingMore && received===0 && lanes.every(lane=>lane.failed))page.error='MERLIN could not be reached. Retained observations are still available.'
    onProgress(page);return page
  }
  if(items.length)emit(true)
  while(lanes.some(lane=>!lane.done)){
    for(const lane of lanes){
      if(lane.done)continue
      const url=new URL(firstUrl);if(lane.connector)url.searchParams.set('connector',lane.connector)
      if(lane.cursor)url.searchParams.set('cursor',lane.cursor)
      try {
        const raw=await read(url) as {items?:StoredObservation[];total?:number;next_cursor?:string|null}
        if(!raw || !Array.isArray(raw.items) || !Number.isFinite(raw.total))throw Error('Invalid document page')
        for(const item of raw.items)if(!item || typeof item.document_id!=='string' || item.protocol_version!=='mayday.intelligence.document/1')throw Error('Unsupported document contract')
        received++;lane.pages++;lane.loaded+=raw.items.length;lane.total??=raw.total
        items=retainObservations(items,raw.items)
        if(!raw.items.length || !raw.next_cursor || lane.loaded>=(lane.total??Infinity))lane.done=true
        else if(lane.pages>=lane.maxPages){lane.done=true;bounded=true}
        else{
          if(lane.seen.has(raw.next_cursor))throw Error('Pagination did not advance')
          lane.seen.add(raw.next_cursor);lane.cursor=raw.next_cursor
        }
      } catch(reason){lane.done=true;lane.failed=true;warnings.push(lane.name+': '+(reason instanceof Error?reason.message:'request failed'))}
      if(lanes.some(item=>!item.done))emit(true)
    }
  }
  return emit(false)
}
