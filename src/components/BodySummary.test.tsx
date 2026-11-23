import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BodySummary } from './BodySummary'
import { bodyProfiles, bodyProfilesReviewedAt } from '../domain/bodyProfiles'
import { celestialBodies } from '../domain/space'
import { SolarSystemNavigator } from './SolarSystemNavigator'

describe('celestial reference profiles', () => {
  it('covers every atlas entry with a brief sourced profile', () => {
    expect(Object.keys(bodyProfiles).sort()).toEqual(celestialBodies.map(body => body.id).sort())
    expect(Number.isNaN(Date.parse(bodyProfilesReviewedAt))).toBe(false)
    for (const body of celestialBodies) {
      const profile = bodyProfiles[body.id]
      expect(profile.paragraphs.length).toBeGreaterThanOrEqual(2)
      expect(profile.paragraphs.length).toBeLessThanOrEqual(3)
      const words = profile.paragraphs.join(' ').split(/\s+/).length
      expect(words).toBeGreaterThanOrEqual(80)
      expect(words).toBeLessThanOrEqual(250)
      expect(profile.sources.length).toBeGreaterThan(0)
      for (const source of profile.sources) {
        expect(new URL(source.url).protocol).toBe('https:')
        expect(source.label.trim()).not.toBe('')
      }
    }
  })
  it('renders every body without an observation provider, with inspectable sources', () => {
    for (const body of celestialBodies) {
      const markup = renderToStaticMarkup(<BodySummary body={body}/>)
      expect(markup).toContain(`aria-label="About ${body.name}"`)
      expect(markup).toContain('Sources · reviewed')
      expect(markup.match(/class="body-summary-paragraph"/g)).toHaveLength(2)
      for (const source of bodyProfiles[body.id].sources) expect(markup).toContain(source.label.replaceAll('&', '&amp;'))
    }
  })
  it('shows reference content in the atlas even when MERLIN is unavailable', () => {
    const markup = renderToStaticMarkup(<SolarSystemNavigator observations={[]} onOpenEarth={()=>{}} error="Provider unavailable"/>)
    expect(markup).toContain('About Earth')
    expect(markup).toContain('Provider unavailable')
    expect(markup).toContain('Landsat')
  })
})
