import data from '../content/bodyConditions.json'
import type { CelestialBody } from '../domain/space'
import './BodyConditions.css'
interface Temperature { kind:string; kelvin?:number; minKelvin?:number; maxKelvin?:number; note:string; sourceUrl:string }
interface Conditions { temperature:Temperature; atmosphere:{kind:string;composition:string;pressure:string;note:string;sourceUrl:string} }
const conditions:Record<string,Conditions> = data.bodies
function formatTemperature(value:Temperature) {
  const degrees=(k:number)=>`${Math.round(k-273.15)} °C / ${Math.round(k)} K`
  if(value.kelvin!==undefined) return `≈ ${degrees(value.kelvin)}`
  if(value.minKelvin!==undefined && value.maxKelvin!==undefined) return `${Math.round(value.minKelvin-273.15)} to ${Math.round(value.maxKelvin-273.15)} °C / ${Math.round(value.minKelvin)}–${Math.round(value.maxKelvin)} K`
  return 'Not applicable'
}
export function BodyConditions({body}:{body:Pick<CelestialBody,'id'|'name'>}) {
  const values=conditions[body.id]
  if(!values)return null
  return <section className="body-conditions" aria-label={`${body.name} physical conditions`}>
    <h3>Physical conditions</h3>
    <dl><div><dt>Temperature · {values.temperature.kind}</dt><dd>{formatTemperature(values.temperature)}</dd></div><div><dt>Atmosphere · {values.atmosphere.kind}</dt><dd>{values.atmosphere.composition}</dd></div><div><dt>Pressure</dt><dd>{values.atmosphere.pressure}</dd></div></dl>
    <details><summary>Measurement basis & sources</summary><p>{values.temperature.note} <a href={values.temperature.sourceUrl} target="_blank" rel="noreferrer">Temperature basis</a></p><p>{values.atmosphere.note} <a href={values.atmosphere.sourceUrl} target="_blank" rel="noreferrer">Atmosphere source</a></p><small>Reference data reviewed {data.reviewedAt}; not live weather. Equilibrium-model values are calculations, not measured surface averages.</small></details>
  </section>
}
