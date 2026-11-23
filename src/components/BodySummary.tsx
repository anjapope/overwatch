import { bodyProfiles, bodyProfilesReviewedAt } from '../domain/bodyProfiles'
import type { CelestialBody } from '../domain/space'
import './BodySummary.css'

/** Reference content stays available when the observation provider is offline. */
export function BodySummary({ body }: { body: Pick<CelestialBody, 'id' | 'name'> }) {
  const profile = bodyProfiles[body.id]
  if (!profile) return null
  return <section className="body-summary" aria-label={`About ${body.name}`}>
    <h3>About {body.name}</h3>
    {profile.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    <details>
      <summary>Sources · reviewed {bodyProfilesReviewedAt}</summary>
      <ul>{profile.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>
      <small>Mission plans reflect this review date; future dates are targets. Potential uses are assessments, not verified resource reserves.</small>
    </details>
  </section>
}
