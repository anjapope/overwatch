import content from '../content/bodyProfiles.json'
export interface BodyProfile {
  paragraphs: string[]
  sources: { label: string; url: string }[]
}
export const bodyProfiles: Readonly<Record<string, BodyProfile>> = content.profiles
export const bodyProfilesReviewedAt = content.reviewedAt
