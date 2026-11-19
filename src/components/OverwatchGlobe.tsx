import { useEffect, useRef } from 'react'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import {
  ImageryLayer,
  EllipsoidTerrainProvider,
  OpenStreetMapImageryProvider,
  Viewer,
  Cartesian3,
  Color,
} from 'cesium'
import { coordinatesFor, type IntelligenceDocument } from '../domain/intelligence'

export interface OverwatchGlobeProps {
  observations?: readonly IntelligenceDocument[]
  selectedId?: string
  onSelect?(document: IntelligenceDocument): void
}

export function OverwatchGlobe({ observations = [], selectedId, onSelect }: OverwatchGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const observationsRef = useRef(observations)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    observationsRef.current = observations
    onSelectRef.current = onSelect
  }, [observations, onSelect])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const viewer = new Viewer(container, {
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
      baseLayer: new ImageryLayer(
        new OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        }),
      ),
    })

    viewer.scene.globe.enableLighting = true
    viewer.scene.requestRenderMode = false
    viewerRef.current = viewer
    const removeSelection = viewer.selectedEntityChanged.addEventListener(entity => {
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
    observations.map(coordinatesFor).filter(item => item !== undefined).forEach(document => {
      viewer.entities.add({ id: document.document_id, name: document.title,
        position: Cartesian3.fromDegrees(document.longitude, document.latitude),
        point: { pixelSize: document.document_id === selectedId ? 14 : 10, color: Color.fromCssColorString('#7ec8ff'), outlineColor: Color.WHITE, outlineWidth: 1 } })
    })
  }, [observations, selectedId])

  return (
    <section className="globe-panel" aria-label="Cesium Earth globe">
      <div ref={containerRef} className="globe-container" />
    </section>
  )
}
