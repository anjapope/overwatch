import { Credit, Ellipsoid, Event, GeographicTilingScheme, HeightmapEncoding, HeightmapTerrainData, Resource, TerrainProvider, TileAvailability, type Request } from 'cesium'
import metadata from '../domain/marsElevation.json'
export const MARS_RADIUS=3396190
export function createMarsElevation(ellipsoid:Ellipsoid):TerrainProvider {
  // This dataset uses angular Mars-2000-sphere coordinates, not WGS84/Earth.
  if (metadata.spatialReference.wkid!==104971 || metadata.tileInfo.origin.x!==-180 || metadata.tileInfo.origin.y!==90 || metadata.tileInfo.format!=='LERC') throw new Error('Unsupported Mars elevation grid')
  const tilingScheme=new GeographicTilingScheme({ellipsoid})
  const width=metadata.tileInfo.cols+1, height=metadata.tileInfo.rows+1
  const maxLevel=metadata.tileInfo.lods.length-1
  const availability=new TileAvailability(tilingScheme,maxLevel)
  for (let level=0;level<=maxLevel;level++) availability.addAvailableTileRange(level,0,0,2**(level+1)-1,2**level-1)
  const error=TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(ellipsoid,width,2)
  return {
    errorEvent:new Event(),credit:new Credit('Mars MOLA/HRSC DEM · NASA, ESA, USGS, Esri'),
    tilingScheme,hasWaterMask:false,hasVertexNormals:false,availability,
    getLevelMaximumGeometricError:level=>error/2**level,
    getTileDataAvailable:(x,y,level)=>level<=maxLevel && x<2**(level+1) && y<2**level,
    loadTileDataAvailability:()=>undefined,
    requestTileGeometry:(x:number,y:number,level:number,request?:Request)=>{
      const url=new URL(`/planetary/terrain/mars/${level}/${x}/${y}`,window.location.href).toString()
      const promise=new Resource({url,request}).fetchArrayBuffer()
      // Cesium’s LERC worker requires the raw ArrayBuffer; its public buffer type omits that supported encoding.
      return promise?.then(buffer=>new HeightmapTerrainData({buffer:buffer as unknown as Uint8Array,width,height,encoding:HeightmapEncoding.LERC,childTileMask:level<maxLevel?15:0}))
    },
  }
}
