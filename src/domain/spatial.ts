// Minimal spatial context. Keep extensible without importing GIS libs.
export type PointCoordinate = {
  latitude: number
  longitude: number
  altitudeMeters?: number
}

export type SpatialContext = { kind: 'point'; point: PointCoordinate }

export function validateCoordinate(c: PointCoordinate): void {
  const { latitude, longitude } = c
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be a finite number between -90 and 90')
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be a finite number between -180 and 180')
  }
}
