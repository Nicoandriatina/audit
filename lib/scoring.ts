/**
 * lib/scoring.ts
 * Moteur de scoring — version serveur (miroir de la logique client dans AuditWizard).
 * Importé par /api/audit/create/route.ts
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType = 'B2B' | 'B2C'

export interface QualificationData {
  businessName: string
  city: string
  sector: string
  activityType: ActivityType
}

export interface SocialAnswers {
  platforms: string[]
  instagramUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  postsFrequency: 'daily' | 'weekly' | 'rarely' | 'never' | ''
  followersRange?: 'none' | 'low' | 'medium' | 'high' | ''
}

export interface WebAnswers {
  hasWebsite: boolean | null
  websiteUrl?: string
  isMobileFriendly: 'yes' | 'no' | 'unknown' | ''
  hasSEO: boolean | null
}

export interface GBPAnswers {
  hasGBP: 'active' | 'unmanaged' | 'no' | ''
  reviewCount: '0-5' | '5-20' | '20-50' | '50+' | ''
  averageRating: '<3.5' | '3.5-4' | '4-4.5' | '4.5+' | ''
  respondsToReviews: 'always' | 'sometimes' | 'never' | ''
}

export interface FunnelAnswers {
  hasContactForm: boolean | null
  hasVisibleCTA: boolean | null
  hasOnlineBooking: boolean | null
  hasLeadTracking: boolean | null
}

export interface BrandingAnswers {
  hasProfessionalLogo: boolean | null
  hasProfessionalPhotos: boolean | null
  hasVisualConsistency: 'yes' | 'partial' | 'no' | ''
  hasSocialProof: boolean | null
}

export interface AuditAnswers {
  qualification: QualificationData
  social: SocialAnswers
  web: WebAnswers
  gbp: GBPAnswers
  funnel: FunnelAnswers
  branding: BrandingAnswers
}

export interface AuditScores {
  global: number
  social: number
  web: number
  gbp: number
  funnel: number
  branding: number
}

export type ScoreLevel = 'red' | 'orange' | 'green'

// ─── Pilier 1 — Réseaux sociaux /20 ──────────────────────────────────────────

function scoreSocial(answers: AuditAnswers): number {
  const { social, qualification } = answers
  let score = 0
  const isB2B = qualification.activityType === 'B2B'

  if (isB2B) {
    if (social.platforms.includes('linkedin')) score += 6
    if (social.platforms.includes('instagram')) score += 4
  } else {
    if (social.platforms.includes('instagram')) score += 6
    if (social.platforms.includes('youtube')) score += 4
  }

  const freq = social.postsFrequency
  if (freq === 'daily') score += 10
  else if (freq === 'weekly') score += 7
  else if (freq === 'rarely') score += 3

  return Math.min(20, score)
}

// ─── Pilier 2 — Présence web /20 ─────────────────────────────────────────────

function scoreWeb(answers: AuditAnswers): number {
  const { web } = answers
  let score = 0
  if (web.hasWebsite === true) score += 8
  if (web.isMobileFriendly === 'yes') score += 5
  if (web.hasSEO === true) score += 4
  if (web.websiteUrl && web.websiteUrl.trim().length > 4) score += 3
  return Math.min(20, score)
}

// ─── Pilier 3 — Google Business Profile /20 ──────────────────────────────────

function scoreGBP(answers: AuditAnswers): number {
  const { gbp } = answers
  if (gbp.hasGBP === 'no' || gbp.hasGBP === '') return 0

  let score = gbp.hasGBP === 'active' ? 5 : 2

  const ratingMap: Record<string, number> = { '<3.5': 1, '3.5-4': 2, '4-4.5': 3, '4.5+': 5 }
  score += ratingMap[gbp.averageRating] ?? 0

  const reviewMap: Record<string, number> = { '0-5': 1, '5-20': 2, '20-50': 3, '50+': 4 }
  score += reviewMap[gbp.reviewCount] ?? 0

  const respondMap: Record<string, number> = { always: 3, sometimes: 2, never: 0 }
  score += respondMap[gbp.respondsToReviews] ?? 0

  return Math.min(20, score)
}

// ─── Pilier 4 — Acquisition / Funnel /20 ─────────────────────────────────────

function scoreFunnel(answers: AuditAnswers): number {
  const { funnel } = answers
  let score = 0
  if (funnel.hasContactForm === true) score += 5
  if (funnel.hasVisibleCTA === true) score += 5
  if (funnel.hasOnlineBooking === true) score += 5
  if (funnel.hasLeadTracking === true) score += 5
  return Math.min(20, score)
}

// ─── Pilier 5 — Branding & crédibilité /20 ───────────────────────────────────

function scoreBranding(answers: AuditAnswers): number {
  const { branding } = answers
  let score = 0
  if (branding.hasProfessionalLogo === true) score += 5
  if (branding.hasProfessionalPhotos === true) score += 5
  if (branding.hasVisualConsistency === 'yes') score += 5
  else if (branding.hasVisualConsistency === 'partial') score += 2
  if (branding.hasSocialProof === true) score += 5
  return Math.min(20, score)
}

// ─── Score global ─────────────────────────────────────────────────────────────

export function calculateScores(answers: AuditAnswers): AuditScores {
  const social = scoreSocial(answers)
  const web = scoreWeb(answers)
  const gbp = scoreGBP(answers)
  const funnel = scoreFunnel(answers)
  const branding = scoreBranding(answers)
  return {
    global: social + web + gbp + funnel + branding,
    social, web, gbp, funnel, branding,
  }
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'red'
  if (score < 70) return 'orange'
  return 'green'
}

export const SCORE_LABELS: Record<ScoreLevel, string> = {
  red: 'Invisible en ligne',
  orange: 'Potentiel non exploité',
  green: 'Bonne base, optimisable',
}

export const SCORE_MESSAGES: Record<ScoreLevel, string> = {
  red: 'Votre présence digitale est insuffisante. Chaque jour, des clients vous cherchent et ne vous trouvent pas.',
  orange: 'Vous avez des bases solides mais vous laissez passer de nombreuses opportunités business.',
  green: 'Votre présence digitale est bien établie. Quelques optimisations peuvent encore amplifier vos résultats.',
}