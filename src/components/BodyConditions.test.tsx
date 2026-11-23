import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BodyConditions } from './BodyConditions'
import data from '../content/bodyConditions.json'
import { celestialBodies } from '../domain/space'
describe('world condition readouts',()=>{
  it('covers the whole atlas and identifies the basis of every temperature',()=>{
    expect(Object.keys(data.bodies).sort()).toEqual(celestialBodies.map(b=>b.id).sort())
    for(const body of celestialBodies){
      const markup=renderToStaticMarkup(<BodyConditions body={body}/>)
      expect(markup).toContain('Physical conditions')
      expect(markup).toContain('Atmosphere')
      expect(markup).toContain('Temperature basis')
    }
  })
  it('distinguishes giant-planet reference levels and computed estimates from surface measurements',()=>{
    expect(renderToStaticMarkup(<BodyConditions body={{id:'earth',name:'Earth'}}/>)).toContain('15 °C / 288 K')
    expect(renderToStaticMarkup(<BodyConditions body={{id:'jupiter',name:'Jupiter'}}/>)).toContain('1-bar atmospheric level')
    expect(renderToStaticMarkup(<BodyConditions body={{id:'sedna',name:'Sedna'}}/>)).toContain('equilibrium model')
    expect(renderToStaticMarkup(<BodyConditions body={{id:'oort-cloud',name:'Oort cloud'}}/>)).toContain('Not applicable')
  })
  it('keeps reference values and ranges physically valid',()=>{
    for(const value of Object.values(data.bodies)) {
      const t=value.temperature as {kelvin?:number;minKelvin?:number;maxKelvin?:number}
      if(t.kelvin!==undefined)expect(t.kelvin).toBeGreaterThan(0)
      if(t.minKelvin!==undefined){expect(t.minKelvin).toBeGreaterThan(0);expect(t.maxKelvin).toBeGreaterThan(t.minKelvin)}
      expect(new URL(value.temperature.sourceUrl).protocol).toBe('https:')
      expect(new URL(value.atmosphere.sourceUrl).protocol).toBe('https:')
    }
  })
})
