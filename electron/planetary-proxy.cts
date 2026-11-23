interface Layer {
  id:string; baseUrl:string; style:string; matrixSet:string; matrixLabels:string[]; extension:string
}
export function planetaryUpstream(pathname:string, layers:Layer[]):string | undefined {
  const image = /^\/planetary\/tiles\/([a-zA-Z0-9_.-]+)\/(\d+)\/(\d+)\/(\d+)$/.exec(pathname)
  if (image) {
    const layer = layers.find(item => item.id === image[1])
    if (!layer || !layer.baseUrl.startsWith('https://trek.nasa.gov/tiles/')) return undefined
    const level=Number(image[2]), x=Number(image[3]), y=Number(image[4])
    if (!Number.isSafeInteger(level) || level < 0 || level >= layer.matrixLabels.length || x < 0 || x >= 2 ** (level + 1) || y < 0 || y >= 2 ** level) return undefined
    return `${layer.baseUrl}/${encodeURIComponent(layer.style)}/${encodeURIComponent(layer.matrixSet)}/${encodeURIComponent(layer.matrixLabels[level])}/${y}/${x}${layer.extension}`
  }
  const terrain = /^\/planetary\/terrain\/mars\/(\d+)\/(\d+)\/(\d+)$/.exec(pathname)
  if (terrain) {
    const level=Number(terrain[1]),x=Number(terrain[2]),y=Number(terrain[3])
    if (level > 7 || x >= 2 ** (level + 1) || y >= 2 ** level) return undefined
    return `https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer/tile/${level}/${y}/${x}`
  }
  return undefined
}
export function createPlanetaryProxy(layers:Layer[], read:typeof fetch = fetch) {
  const cache=new Map<string,{body:Uint8Array;type:string}>()
  const pending=new Map<string,Promise<Response>>()
  let bytes=0
  return async (pathname:string):Promise<Response> => {
    const url=planetaryUpstream(pathname,layers)
    if (!url) return new Response('Unknown planetary tile',{status:404})
    const cached=cache.get(url)
    if (cached) { cache.delete(url);cache.set(url,cached);return new Response(cached.body,{headers:{'Content-Type':cached.type}}) }
    if (pending.has(url)) return (await pending.get(url)!).clone()
    const work=(async()=>{
      try {
        const result=await read(url,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(20_000)})
        if (!result.ok) return new Response('Planetary tile unavailable',{status:result.status})
        const size=Number(result.headers.get('content-length') || 0)
        if (size>8*1024*1024) return new Response('Planetary tile exceeds size limit',{status:413})
        const body=new Uint8Array(await result.arrayBuffer())
        if (body.byteLength>8*1024*1024) return new Response('Planetary tile exceeds size limit',{status:413})
        const isTerrain=pathname.startsWith('/planetary/terrain/')
        const type=isTerrain?'application/octet-stream':url.endsWith('.png')?'image/png':'image/jpeg'
        if (!isTerrain && !result.headers.get('content-type')?.startsWith('image/')) return new Response('Invalid map tile',{status:502})
        cache.set(url,{body,type});bytes+=body.byteLength
        while (bytes>32*1024*1024 && cache.size>1) {const key=cache.keys().next().value!;bytes-=cache.get(key)!.body.byteLength;cache.delete(key)}
        return new Response(body,{headers:{'Content-Type':type,'Cache-Control':'max-age=86400'}})
      } catch { return new Response('Planetary service could not be reached',{status:502}) }
      finally { pending.delete(url) }
    })()
    pending.set(url,work)
    return (await work).clone()
  }
}
