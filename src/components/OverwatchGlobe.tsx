import { useEffect, useRef } from 'react'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import {
  ImageryLayer,
  EllipsoidTerrainProvider,
  OpenStreetMapImageryProvider,
  Viewer,
} from 'cesium'

import type { OverwatchEvent } from '../domain/overwatch'

export interface OverwatchGlobeProps {
  events?: readonly OverwatchEvent[]
}

export function OverwatchGlobe({ events = [] }: OverwatchGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  void events

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

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
    }
  }, [])

  return (
    <section className="globe-panel" aria-label="Cesium Earth globe">
      <div ref={containerRef} className="globe-container" />
    </section>
  )
}
