import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SolarSystemNavigator } from './SolarSystemNavigator'
import { celestialBodies } from '../domain/space'
describe('solar atlas navigation', () => {
 it('renders an accessible selector for every catalog entry', () => {
  const markup=renderToStaticMarkup(<SolarSystemNavigator observations={[]} onOpenEarth={()=>{}}/>)
  for(const body of celestialBodies) expect(markup).toContain(`aria-label="Select ${body.name}"`)
 })
 it('shows refresh and retrieval errors within the solar atlas', () => {
  const markup=renderToStaticMarkup(<SolarSystemNavigator observations={[]} onOpenEarth={()=>{}} error="Provider unavailable"/>)
  expect(markup).toContain('Provider unavailable');expect(markup).toContain('Refresh evidence');expect(markup).not.toContain('archive requested')
 })
})
