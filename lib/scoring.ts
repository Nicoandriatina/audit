import {
  getSectorTemplate,
  calculateWeightedScore,
  getSectorPercentile,
  type SectorTemplate,
  type SectorBonusContext,
} from './sector-templates'
import {
  estimateLostClients,
  getLostClientsMessage,
  type LostClientsEstimate,
} from './lost-clients'

// Ré-export des types depuis @/types/audit pour rétrocompatibilité des imports existants
// Types wizard — définis dans types/audit.ts de votre projet
export type {
  ActivityType,
  AuditAnswers,
  QualificationData,
  SocialAnswers,
  WebAnswers,
  GBPAnswers,
  FunnelAnswers,
  BrandingAnswers,
} from '@/types/audit'

import type { AuditAnswers } from '@/types/audit'
import type { AuditScores } from './audit-types'

// AuditScores et ScoreLevel — dans lib/audit-types.ts (pas dans types/audit.ts)
export type { AuditScores, ScoreLevel } from './audit-types'

// ─── FullAuditResult ──────────────────────────────────────────────────────────

export interface FullAuditResult {
  scores:      AuditScores
  template:    SectorTemplate
  percentile:  { percentile: number; label: string }
  lostClients: LostClientsEstimate
  lostMessage: { headline: string; subline: string; urgency: 'critical' | 'high' | 'medium' }
  sectorTips:  Record<string, string>
}

// ─── Pilier 1 — Réseaux sociaux /20 ──────────────────────────────────────────

function scoreSocial(answers: AuditAnswers): number {
  const { social, qualification } = answers
  let score = 0
  const isB2B = qualification.activityType === 'B2B'
  if (isB2B) {
    if (social.platforms.includes('linkedin'))  score += 6
    if (social.platforms.includes('instagram')) score += 4
  } else {
    if (social.platforms.includes('instagram')) score += 6
    if (social.platforms.includes('youtube'))   score += 4
  }
  const freq = social.postsFrequency
  if (freq === 'daily')       score += 10
  else if (freq === 'weekly') score += 7
  else if (freq === 'rarely') score += 3
  return Math.min(20, score)
}

// ─── Pilier 2 — Présence web /20 ─────────────────────────────────────────────

function scoreWeb(answers: AuditAnswers): number {
  const { web } = answers
  let score = 0
  if (web.hasWebsite === true)                        score += 8
  if (web.isMobileFriendly === 'yes')                 score += 5
  if (web.hasSEO === true)                            score += 4
  if ((web.websiteUrl?.trim().length ?? 0) > 4)       score += 3
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
  if (funnel.hasContactForm   === true) score += 5
  if (funnel.hasVisibleCTA    === true) score += 5
  if (funnel.hasOnlineBooking === true) score += 5
  if (funnel.hasLeadTracking  === true) score += 5
  return Math.min(20, score)
}

// ─── Pilier 5 — Branding & crédibilité /20 ───────────────────────────────────

function scoreBranding(answers: AuditAnswers): number {
  const { branding } = answers
  let score = 0
  if (branding.hasProfessionalLogo   === true)      score += 5
  if (branding.hasProfessionalPhotos === true)      score += 5
  if (branding.hasVisualConsistency  === 'yes')     score += 5
  else if (branding.hasVisualConsistency === 'partial') score += 2
  if (branding.hasSocialProof        === true)      score += 5
  return Math.min(20, score)
}

// ─── Contexte bonus ───────────────────────────────────────────────────────────

function buildBonusContext(answers: AuditAnswers): SectorBonusContext {
  return {
    activityType:          answers.qualification.activityType,
    hasGBP:                answers.gbp.hasGBP,
    reviewCount:           answers.gbp.reviewCount,
    averageRating:         answers.gbp.averageRating,
    respondsToReviews:     answers.gbp.respondsToReviews,
    hasOnlineBooking:      answers.funnel.hasOnlineBooking,
    hasWebsite:            answers.web.hasWebsite,
    hasSEO:                answers.web.hasSEO,
    platforms:             answers.social.platforms,
    postsFrequency:        answers.social.postsFrequency,
    hasProfessionalPhotos: answers.branding.hasProfessionalPhotos,
    hasSocialProof:        answers.branding.hasSocialProof,
    hasContactForm:        answers.funnel.hasContactForm,
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export function calculateFullAuditResult(answers: AuditAnswers): FullAuditResult {
  const social   = scoreSocial(answers)
  const web      = scoreWeb(answers)
  const gbp      = scoreGBP(answers)
  const funnel   = scoreFunnel(answers)
  const branding = scoreBranding(answers)
  const globalRaw = social + web + gbp + funnel + branding

  const template  = getSectorTemplate(answers.qualification.sector)
  const bonusCtx  = buildBonusContext(answers)
  const global    = calculateWeightedScore({ social, web, gbp, funnel, branding }, template, bonusCtx)

  const scores: AuditScores = { global, globalRaw, social, web, gbp, funnel, branding }

  const percentile  = getSectorPercentile(global, template)
  const lostClients = estimateLostClients(answers, scores, template)
  const lostMessage = getLostClientsMessage(lostClients, answers.qualification.city)

  return { scores, template, percentile, lostClients, lostMessage, sectorTips: template.sectorTips }
}

/** Rétrocompatibilité — utilisé par les routes existantes */
export function calculateScores(answers: AuditAnswers): AuditScores {
  const social   = scoreSocial(answers)
  const web      = scoreWeb(answers)
  const gbp      = scoreGBP(answers)
  const funnel   = scoreFunnel(answers)
  const branding = scoreBranding(answers)
  const globalRaw = social + web + gbp + funnel + branding

  const template = getSectorTemplate(answers.qualification.sector)
  const bonusCtx = buildBonusContext(answers)
  const global   = calculateWeightedScore({ social, web, gbp, funnel, branding }, template, bonusCtx)

  return { global, globalRaw, social, web, gbp, funnel, branding }
}

export function getScoreLevel(score: number): 'red' | 'orange' | 'green' {
  if (score < 40) return 'red'
  if (score < 70) return 'orange'
  return 'green'
}

export const SCORE_LABELS = {
  red:    'Invisible en ligne',
  orange: 'Potentiel non exploité',
  green:  'Bonne base, optimisable',
}

export const SCORE_MESSAGES = {
  red:    'Votre présence digitale est insuffisante. Chaque jour, des clients vous cherchent et ne vous trouvent pas.',
  orange: 'Vous avez des bases solides mais vous laissez passer de nombreuses opportunités business.',
  green:  'Votre présence digitale est bien établie. Quelques optimisations peuvent encore amplifier vos résultats.',
}