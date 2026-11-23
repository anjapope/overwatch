/** Keep all scene/camera calculations on the selected world, without changing global Cesium defaults. */
export function surfaceSceneOptions<T extends object>(ellipsoid:T) {
  return {
    ellipsoid,skyAtmosphere:false as const,skyBox:false as const,
    requestRenderMode:true,maximumRenderTimeChange:Number.POSITIVE_INFINITY,
    useBrowserRecommendedResolution:true,orderIndependentTranslucency:false,msaaSamples:1,
  }
}
export function surfaceCameraPolicy(radius:number) {
  if (!Number.isFinite(radius) || radius<=0) throw new Error('Invalid body radius')
  return {
    minimumZoomDistance:Math.max(.25,Math.min(50,radius*.0001)),
    maximumZoomDistance:radius*30,
    minimumPickingTerrainHeight:Math.max(1,radius*.025),
    minimumCollisionTerrainHeight:Math.max(1,radius*.0025),
    minimumTrackBallHeight:radius*1.175,
    enableCollisionDetection:true,zoomFactor:2,inertiaZoom:0,inertiaSpin:.4,inertiaTranslate:.4,
    maximumMovementRatio:.05,
  }
}
export const surfaceQuality={
  responsive:{resolutionScale:.8,maximumScreenSpaceError:3,targetFrameRate:30},
  detailed:{resolutionScale:1,maximumScreenSpaceError:2,targetFrameRate:60},
} as const
