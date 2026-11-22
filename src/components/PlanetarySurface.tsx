import { useEffect, useMemo, useRef, useState } from 'react'
import { Cartesian2, Cartesian3, Cartographic, Color, Ellipsoid, EllipsoidTerrainProvider, GeographicProjection, GeographicTilingScheme, Globe, Math as CesiumMath, Rectangle, UrlTemplateImageryProvider, Viewer } from 'cesium'
import { layersForBody, planetaryLandmarks } from '../domain/planetary'
import { createMarsElevation } from '../planetary/elevation'

export default function PlanetarySurface({bodyId,name}:{bodyId:string;name:string}) {
  const layers=useMemo(()=>layersForBody(bodyId),[bodyId])
  const [layerId,setLayerId]=useState(layers[0]?.id)
  const [terrain,setTerrain]=useState(bodyId==='mars')
  const [exaggeration,setExaggeration]=useState(1)
  const [error,setError]=useState<string>()
  const [pending,setPending]=useState(0)
  const [coordinates,setCoordinates]=useState('')
  const container=useRef<HTMLDivElement>(null)
  const viewerRef=useRef<Viewer | undefined>(undefined)
  const active=layers.find(layer=>layer.id===layerId) ?? layers[0]
  useEffect(()=>{
    if (!container.current || !layers.length) return
    const radius=layers[0].radiusMeters
    const ellipsoid=new Ellipsoid(radius,radius,radius)
    let viewer:Viewer
    try {
      viewer=new Viewer(container.current,{
        globe:new Globe(ellipsoid),mapProjection:new GeographicProjection(ellipsoid),
        terrainProvider:new EllipsoidTerrainProvider({ellipsoid}),baseLayer:false,
        animation:false,timeline:false,geocoder:false,baseLayerPicker:false,homeButton:false,
        navigationHelpButton:false,sceneModePicker:true,fullscreenButton:false,infoBox:false,selectionIndicator:false,
      })
    } catch(reason) { queueMicrotask(()=>setError(reason instanceof Error?reason.message:'Surface viewer could not start'));return }
    viewerRef.current=viewer
    viewer.scene.globe.baseColor=Color.fromCssColorString('#15202c')
    viewer.scene.globe.showGroundAtmosphere=false
    viewer.scene.globe.maximumScreenSpaceError=2
    viewer.scene.screenSpaceCameraController.minimumZoomDistance=Math.max(1,radius/100000)
    viewer.scene.screenSpaceCameraController.maximumZoomDistance=radius*30
    viewer.camera.setView({destination:Cartesian3.fromDegrees(0,0,radius*2.8,ellipsoid)})
    const removeProgress=viewer.scene.globe.tileLoadProgressEvent.addEventListener(count=>setPending(count))
    const click=(event:MouseEvent)=>{
      const bounds=container.current?.getBoundingClientRect()
      if (!bounds || viewer.isDestroyed()) return
      const screen=new Cartesian2(event.clientX-bounds.left,event.clientY-bounds.top)
      const position=viewer.camera.pickEllipsoid(screen,ellipsoid)
      if (!position) return
      const cartographic=ellipsoid.cartesianToCartographic(position) as Cartographic
      setCoordinates(`${CesiumMath.toDegrees(cartographic.latitude).toFixed(4)}° lat · ${CesiumMath.toDegrees(cartographic.longitude).toFixed(4)}° lon · reference sphere`)
    }
    container.current.addEventListener('click',click)
    const element=container.current
    return ()=>{element.removeEventListener('click',click);removeProgress();viewerRef.current=undefined;viewer.destroy()}
  },[bodyId,layers])
  useEffect(()=>{
    const viewer=viewerRef.current
    if (!viewer || !active) return
    queueMicrotask(()=>setError(undefined))
    const ellipsoid=viewer.scene.globe.ellipsoid
    const provider=new UrlTemplateImageryProvider({
      url:new URL(`/planetary/tiles/${active.id}/{z}/{x}/{y}`,window.location.href).toString().replaceAll('%7B','{').replaceAll('%7D','}'),
      tilingScheme:new GeographicTilingScheme({ellipsoid}),
      minimumLevel:0,maximumLevel:active.matrixLabels.length-1,tileWidth:active.tileWidth,tileHeight:active.tileHeight,
      rectangle:Rectangle.fromDegrees(...active.rectangle as [number,number,number,number]),
      credit:'NASA/JPL-Caltech Solar System Treks · mission teams / USGS',
    })
    const removeError=provider.errorEvent.addEventListener(()=>setError('Some map tiles are unavailable. Switch layers or retry; this region may have incomplete coverage.'))
    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(provider)
    if (active.rectangle[2]-active.rectangle[0]<30) void viewer.camera.flyTo({destination:Rectangle.fromDegrees(...active.rectangle as [number,number,number,number])})
    return removeError
  },[active])
  useEffect(()=>{
    const viewer=viewerRef.current
    if (!viewer) return
    const ellipsoid=viewer.scene.globe.ellipsoid
    viewer.terrainProvider=terrain && bodyId==='mars'?createMarsElevation(ellipsoid):new EllipsoidTerrainProvider({ellipsoid})
    viewer.scene.verticalExaggeration=exaggeration
  },[terrain,exaggeration,bodyId])
  const fly=(longitude:number,latitude:number,height:number)=>{
    const viewer=viewerRef.current
    if(viewer) void viewer.camera.flyTo({destination:Cartesian3.fromDegrees(longitude,latitude,height,viewer.scene.globe.ellipsoid)})
  }
  if (!active) return <p>No verified surface layer is available for {name}.</p>
  return <div className="planetary-surface">
    <div className="surface-toolbar">
      <label>Surface map<select value={layerId} onChange={event=>setLayerId(event.target.value)}>{layers.map(layer=><option key={layer.id} value={layer.id}>{layer.name} · {layer.kind}</option>)}</select></label>
      <button onClick={()=>fly(0,0,active.radiusMeters*2.8)}>Whole body</button>
      {bodyId==='mars' && <label className="terrain-toggle"><input type="checkbox" checked={terrain} onChange={event=>setTerrain(event.target.checked)}/>3D elevation</label>}
      {terrain && bodyId==='mars' && <label>Relief ×{exaggeration}<input aria-label="Terrain vertical exaggeration" type="range" min="1" max="5" step=".5" value={exaggeration} onChange={event=>setExaggeration(Number(event.target.value))}/></label>}
    </div>
    <div ref={container} className="surface-canvas" aria-label={`Interactive ${name} scientific surface map`}/>
    <div className="surface-status" role="status">{pending?`Streaming ${pending} map/terrain tiles…`:'Drag to rotate · wheel/pinch to zoom · right-drag to tilt'}{coordinates && <span>{coordinates}</span>}</div>
    {error && <p className="surface-error" role="alert">{error}</p>}
    {!!planetaryLandmarks[bodyId]?.length && <nav className="surface-landmarks" aria-label="Surface features">{planetaryLandmarks[bodyId].map(site=><button key={site.name} onClick={()=>fly(site.longitude,site.latitude,site.height)}>{site.name}</button>)}</nav>}
    <div className="surface-source"><strong>{active.name}</strong><span>{terrain && bodyId==='mars'?'Measured Mars DEM · MOLA/HRSC, nominal 200 m grid':'Map imagery on an approximate reference sphere; shaded relief is not 3D elevation.'} {exaggeration>1 && terrain && bodyId==='mars'?`Vertical heights exaggerated ×${exaggeration}.`:''}</span><span>Finest published tile level: {active.matrixLabels.length-1}. Zooming closer does not create additional source detail. Regional mosaics may have gaps.</span><a href={active.sourceUrl} target="_blank" rel="noreferrer">NASA layer metadata and coverage</a><a href={`https://trek.nasa.gov/${bodyId}/`} target="_blank" rel="noreferrer">Open NASA terrain and measurement tools</a></div>
  </div>
}
