import { useEffect, useMemo, useRef, useState } from 'react'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import {
  ImageryLayer,
  EllipsoidTerrainProvider,
  TileMapServiceImageryProvider,
  Viewer,
  Cartesian3,
  Color,
  HeadingPitchRange,
  Rectangle,
  buildModuleUrl,
} from 'cesium'
import { coordinatesFor, type IntelligenceDocument } from '../domain/intelligence'
import type { RegionalDossier } from '../analysis/regionalIntelligence'

export interface OverwatchGlobeProps {
  observations?: readonly IntelligenceDocument[]
  dossiers?: readonly RegionalDossier[]
  selectedId?: string
  selectedRegionId?: string
  onSelect?(document: IntelligenceDocument): void
  onSelectRegion?(dossier: RegionalDossier): void
}

const signalColor = (signal: RegionalDossier['signal']) => signal === 'conflict' ? Color.fromCssColorString('#ff443d') : signal === 'attention' ? Color.fromCssColorString('#ffb84d') : Color.fromCssColorString('#42bff5')
const ukraineHotspots = [
  { id:'kyiv', name:'Kyiv', longitude:30.5234, latitude:50.4501, terms:/\b(kyiv|kiev)\b/i },
  { id:'kharkiv', name:'Kharkiv', longitude:36.2304, latitude:49.9935, terms:/\bkharkiv\b/i },
  { id:'donbas', name:'Donbas', longitude:37.8, latitude:48.0, terms:/\b(donbas|donetsk|luhansk)\b/i },
  { id:'zaporizhzhia', name:'Zaporizhzhia', longitude:35.1396, latitude:47.8388, terms:/\b(zaporizhzhia|zaporizhia)\b/i },
  { id:'odesa', name:'Odesa', longitude:30.7233, latitude:46.4825, terms:/\b(odesa|odessa)\b/i },
  { id:'crimea', name:'Crimea', longitude:34.1, latitude:45.2, terms:/\bcrimea\b/i },
]
const documentText = (document: IntelligenceDocument) => `${document.title} ${document.summary ?? ''}`

export function OverwatchGlobe({ observations = [], dossiers = [], selectedId, selectedRegionId, onSelect, onSelectRegion }: OverwatchGlobeProps) {
  const [globeError, setGlobeError] = useState<string>()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const observationsRef = useRef(observations)
  const onSelectRef = useRef(onSelect)
  const dossiersRef = useRef(dossiers)
  const onSelectRegionRef = useRef(onSelectRegion)
  const ukraineObservations = useMemo(()=>observations.filter(document => /\b(ukraine|ukrainian|kyiv|kharkiv|donbas|donetsk|luhansk|zaporizhzhia|odesa|crimea)\b/i.test(documentText(document))),[observations])

  useEffect(() => {
    observationsRef.current = observations
    onSelectRef.current = onSelect
    dossiersRef.current = dossiers
    onSelectRegionRef.current = onSelectRegion
  }, [observations, dossiers, onSelect, onSelectRegion])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    let viewer: Viewer
    try {
      viewer = new Viewer(container, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: true,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        terrainProvider: new EllipsoidTerrainProvider(),
        baseLayer: ImageryLayer.fromProviderAsync(
          TileMapServiceImageryProvider.fromUrl(
            buildModuleUrl('Assets/Textures/NaturalEarthII'),
          ),
        ),
      })
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      console.error('Cesium viewer initialization failed', reason)
      queueMicrotask(() => setGlobeError(message))
      return undefined
    }

    viewer.scene.globe.enableLighting = true
    viewer.scene.requestRenderMode = false
    const cameraController = viewer.scene.screenSpaceCameraController
    cameraController.inertiaZoom = 0
    cameraController.minimumZoomDistance = 750_000
    cameraController.maximumZoomDistance = 25_000_000
    viewer.camera.lookAt(
      Cartesian3.ZERO,
      new HeadingPitchRange(0, -Math.PI / 2, 22_000_000),
    )
    viewerRef.current = viewer
    const removeSelection = viewer.selectedEntityChanged.addEventListener(entity => {
      if (entity?.id.startsWith('region:')) {
        const dossier = dossiersRef.current.find(item => item.region.id === entity.id.slice('region:'.length))
        if (dossier) onSelectRegionRef.current?.(dossier)
        return
      }
      const document = observationsRef.current.find(item => item.document_id === entity?.id)
      if (document) onSelectRef.current?.(document)
    })

    return () => {
      removeSelection()
      viewerRef.current = null
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.entities.removeAll()
    dossiers.forEach(dossier => {
      const color = signalColor(dossier.signal)
      viewer.entities.add({
        id: `region:${dossier.region.id}`,
        name: `${dossier.region.name} — ${dossier.observations.length} reports`,
        rectangle: {
          coordinates: Rectangle.fromDegrees(...dossier.region.bounds),
          material: color.withAlpha(dossier.region.id === selectedRegionId ? 0.28 : 0.1),
          outline: true,
          outlineColor: color.withAlpha(0.95),
          height: 2_000,
        },
      })
    })
    ukraineHotspots.forEach(hotspot => {
      const matched = ukraineObservations.filter(document => hotspot.terms.test(documentText(document)))
      if (!matched.length) return
      viewer.entities.add({
        id:`ukraine:${hotspot.id}`, name:`${hotspot.name} — ${matched.length} evidence mention(s)`,
        position:Cartesian3.fromDegrees(hotspot.longitude,hotspot.latitude,12_000),
        point:{pixelSize:10+Math.min(matched.length,6),color:Color.fromCssColorString('#ff443d'),outlineColor:Color.WHITE,outlineWidth:2},
      })
    })
    if (ukraineObservations.length) viewer.entities.add({
      id:'ukraine:eastern-context', name:'Ukraine eastern conflict context — symbolic, not a claimed front line',
      polyline:{positions:[Cartesian3.fromDegrees(36.23,49.99,8_000),Cartesian3.fromDegrees(37.8,48,8_000),Cartesian3.fromDegrees(35.14,47.84,8_000),Cartesian3.fromDegrees(34.1,45.2,8_000)],width:3,material:Color.fromCssColorString('#ff443d').withAlpha(.8)},
    })
    observations.map(coordinatesFor).filter(item => item !== undefined).forEach(document => {
      viewer.entities.add({ id: document.document_id, name: document.title,
        position: Cartesian3.fromDegrees(document.longitude, document.latitude),
        point: { pixelSize: document.document_id === selectedId ? 14 : 10, color: Color.fromCssColorString('#7ec8ff'), outlineColor: Color.WHITE, outlineWidth: 1 } })
    })
  }, [observations, dossiers, selectedId, selectedRegionId, ukraineObservations])

  return (
    <section className="globe-panel" aria-label="Cesium Earth globe">
      <div ref={containerRef} className="globe-container" />
      {globeError && <div className="globe-error" role="alert"><strong>Globe initialization failed</strong><span>{globeError}</span></div>}
      <nav className="region-legend" aria-label="Active intelligence regions">
        <span className="eyebrow">Regional signals</span>
        {dossiers.map(dossier => <button key={dossier.region.id} className={`${dossier.signal} ${dossier.region.id === selectedRegionId ? 'selected' : ''}`} onClick={() => onSelectRegion?.(dossier)}>
          <i aria-hidden="true" /><span>{dossier.region.name}</span><strong>{dossier.observations.length}</strong>
        </button>)}
        {ukraineObservations.length>0&&<button className="conflict" onClick={()=>viewerRef.current?.camera.flyTo({destination:Rectangle.fromDegrees(21.5,44,41.5,53),duration:.8})} title="Evidence-linked mention anchors; the connecting line is symbolic and is not a claimed front line"><i aria-hidden="true"/><span>Ukraine detail</span><strong>{ukraineObservations.length}</strong></button>}
      </nav>
    </section>
  )
}
