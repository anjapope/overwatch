import catalog from './planetaryLayers.json'
export const planetaryLayers=catalog.layers
export type PlanetaryLayer=typeof planetaryLayers[number]
export function layersForBody(body:string):PlanetaryLayer[] { return planetaryLayers.filter(layer=>layer.body===body) }
export function tileUrl(layer:PlanetaryLayer,level:number,x:number,y:number) {
  if (!Number.isInteger(level) || level<0 || level>=layer.matrixLabels.length || !Number.isInteger(x) || !Number.isInteger(y) || x<0 || y<0 || x>=2**(level+1) || y>=2**level) throw new Error('Tile outside published coverage')
  return `/planetary/tiles/${encodeURIComponent(layer.id)}/${level}/${x}/${y}`
}
export const planetaryLandmarks:Record<string,Array<{name:string;longitude:number;latitude:number;height:number}>>={
  moon:[{name:'Tycho crater',longitude:-11.36,latitude:-43.31,height:250000},{name:'Copernicus crater',longitude:-20.08,latitude:9.62,height:250000},{name:'Tranquility Base vicinity',longitude:23.47,latitude:.67,height:60000},{name:'South polar region',longitude:0,latitude:-88,height:180000}],
  mars:[{name:'Olympus Mons',longitude:-133.8,latitude:18.65,height:900000},{name:'Valles Marineris',longitude:-59.2,latitude:-13.9,height:1000000},{name:'Curiosity / Gale crater',longitude:137.4,latitude:-4.6,height:100000},{name:'Jezero crater',longitude:77.45,latitude:18.44,height:120000}],
}
