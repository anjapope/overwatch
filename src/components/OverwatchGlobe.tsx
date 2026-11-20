import { useEffect, useRef, useState } from 'react'
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

export function OverwatchGlobe({ observations = [], dossiers = [], selectedId, selectedRegionId, onSelect, onSelectRegion }: OverwatchGlobeProps) {
  const [globeError, setGlobeError] = useState<string>()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const observationsRef = useRef(observations)
  const onSelectRef = useRef(onSelect)
  const dossiersRef = useRef(dossiers)
  const onSelectRegionRef = useRef(onSelectRegion)

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
    observations.map(coordinatesFor).filter(item => item !== undefined).forEach(document => {
      viewer.entities.add({ id: document.document_id, name: document.title,
        position: Cartesian3.fromDegrees(document.longitude, document.latitude),
        point: { pixelSize: document.document_id === selectedId ? 14 : 10, color: Color.fromCssColorString('#7ec8ff'), outlineColor: Color.WHITE, outlineWidth: 1 } })
    })
  }, [observations, dossiers, selectedId, selectedRegionId])

  return (
    <section className="globe-panel" aria-label="Cesium Earth globe">
      <div ref={containerRef} className="globe-container" />
      {globeError && <div className="globe-error" role="alert"><strong>Globe initialization failed</strong><span>{globeError}</span></div>}
      <nav className="region-legend" aria-label="Active intelligence regions">
        <span className="eyebrow">Regional signals</span>
        {dossiers.map(dossier => <button key={dossier.region.id} className={`${dossier.signal} ${dossier.region.id === selectedRegionId ? 'selected' : ''}`} onClick={() => onSelectRegion?.(dossier)}>
          <i aria-hidden="true" /><span>{dossier.region.name}</span><strong>{dossier.observations.length}</strong>
        </button>)}
      </nav>
    </section>
  )
}
