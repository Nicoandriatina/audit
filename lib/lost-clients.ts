

import type { SectorTemplate } from './sector-templates'
import type { AuditAnswers } from '@/types/audit'
import type { AuditScores } from './audit-types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LostClientsEstimate {
  monthlyLostLeads:         number
  monthlyLostRevenue:       number
  yearlyLostRevenue:        number
  yearlyPotentialGain:      number
  estimatedConversionRate:  number
  sectorAvgConversionRate:  number
  estimatedMonthlyTraffic:  number
  range: { low: number; mid: number; high: number }
  hypotheses: string[]
}

// ─── Populations villes ───────────────────────────────────────────────────────

const CITY_POPULATIONS: Record<string, number> = {
  // Suisse
  'zurich': 440_000, 'zürich': 440_000,
  'genève': 200_000, 'geneva': 200_000, 'geneve': 200_000,
  'bâle': 180_000, 'bale': 180_000, 'basel': 180_000,
  'lausanne': 140_000,
  'berne': 133_000, 'bern': 133_000,
  'winterthur': 115_000,
  'lucerne': 82_000, 'luzern': 82_000,
  'saint-gall': 75_000, 'st. gallen': 75_000,
  'lugano': 63_000,
  'bienne': 55_000, 'biel': 55_000,
  'thoune': 43_000, 'thun': 43_000,
  'neuchâtel': 43_000, 'neuchatel': 43_000,
  'fribourg': 37_000,
  'vernier': 36_000,
  'la chaux-de-fonds': 38_000,
  'schaffhouse': 36_000, 'schaffhausen': 36_000,
  'chur': 36_000, 'coire': 36_000,
  'sion': 33_000,
  'sierre': 17_000,
  'martigny': 19_000,
  'monthey': 19_000,
  // France
  'paris': 2_100_000,
  'marseille': 870_000,
  'lyon': 520_000,
  'toulouse': 480_000,
  'nice': 340_000,
  'nantes': 310_000,
  'montpellier': 290_000,
  'strasbourg': 280_000,
  'bordeaux': 260_000,
  'lille': 230_000,
  'rennes': 220_000,
  'grenoble': 160_000,
  'dijon': 155_000,
  'toulon': 176_000,
  'reims': 182_000,
  'clermont-ferrand': 145_000,
}

const DEFAULT_POPULATION = 50_000

// ─── Taux de conversion selon score ──────────────────────────────────────────

function estimateConversionRate(globalScore: number, sectorAvgRate: number): number {
  const multiplier = 0.20 + (globalScore / 100) * 1.20
  return sectorAvgRate * multiplier
}

// ─── Moteur principal ─────────────────────────────────────────────────────────

export function estimateLostClients(
  answers: AuditAnswers,
  scores:  AuditScores,
  template: SectorTemplate,
): LostClientsEstimate {
  const { lostClients: params, benchmarks } = template
  const city = answers.qualification?.city?.toLowerCase().trim() ?? ''

  const population          = CITY_POPULATIONS[city] ?? DEFAULT_POPULATION
  const monthlySearchVolume = Math.round(population * params.monthlySearchesPerCapita)

  const sectorAvgRate       = params.avgConversionRate
  const estimatedRate       = estimateConversionRate(scores.global, sectorAvgRate)

  const currentMonthlyLeads   = monthlySearchVolume * estimatedRate
  const sectorAvgMonthlyLeads = monthlySearchVolume * sectorAvgRate
  const topQuartileRate       = sectorAvgRate * 1.6
  const topMonthlyLeads       = monthlySearchVolume * topQuartileRate

  const monthlyLostLeads   = Math.max(0, Math.round(sectorAvgMonthlyLeads - currentMonthlyLeads))
  const monthlyLostRevenue = Math.round(monthlyLostLeads * params.avgTicketEur)
  const yearlyLostRevenue  = Math.round(monthlyLostLeads * 12 * params.avgTicketEur)
  const yearlyPotentialGain = Math.max(0, Math.round(
    (topMonthlyLeads - currentMonthlyLeads) * 12 * params.avgTicketEur
  ))

  const range = {
    low:  Math.round(yearlyLostRevenue * 0.70),
    mid:  yearlyLostRevenue,
    high: Math.round(yearlyLostRevenue * 1.35),
  }

  const lifetimeValue = params.avgTicketEur * params.avgRetentionMultiplier
  const pop = population >= 1_000_000
    ? `${(population / 1_000_000).toFixed(1)}M`
    : `${Math.round(population / 1_000)}k`

  const hypotheses = [
    `Zone d'activité : ${city || 'votre ville'} (population estimée ${pop} habitants)`,
    `Volume de recherches locales estimé : ~${monthlySearchVolume.toLocaleString('fr-CH')} recherches/mois dans votre secteur`,
    `Votre taux de conversion estimé : ${(estimatedRate * 100).toFixed(1)}% (moyenne sectorielle : ${(sectorAvgRate * 100).toFixed(1)}%)`,
    `Ticket moyen du secteur : CHF ${params.avgTicketEur.toLocaleString('fr-CH')} — valeur vie client : CHF ${lifetimeValue.toLocaleString('fr-CH')}`,
    `Votre score (${scores.global}/100) vs moyenne sectorielle (${benchmarks.avgScore}/100) : écart de ${Math.abs(scores.global - benchmarks.avgScore)} points`,
    `Estimation conservatrice — fourchette réelle entre ${Math.round((estimatedRate / sectorAvgRate) * 70)}% et ${Math.round((estimatedRate / sectorAvgRate) * 135)}% de ce montant`,
  ]

  return {
    monthlyLostLeads,
    monthlyLostRevenue,
    yearlyLostRevenue,
    yearlyPotentialGain,
    estimatedConversionRate: estimatedRate,
    sectorAvgConversionRate: sectorAvgRate,
    estimatedMonthlyTraffic: monthlySearchVolume,
    range,
    hypotheses,
  }
}

// ─── Formatage ────────────────────────────────────────────────────────────────

export function formatRevenue(amount: number, city?: string): string {
  const swissCities = new Set(['zurich','zürich','genève','geneva','geneve','bâle','bale','basel',
    'lausanne','berne','bern','winterthur','lucerne','luzern','lugano','bienne','biel',
    'sion','fribourg','neuchâtel','neuchatel','sierre','martigny','monthey','thoune','thun'])
  const currency = swissCities.has(city?.toLowerCase().trim() ?? '') ? 'CHF' : '€'
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `${currency} ${Math.round(amount / 1_000)}k`
  return `${currency} ${amount}`
}

export function getLostClientsMessage(
  estimate: LostClientsEstimate,
  city?: string,
): { headline: string; subline: string; urgency: 'critical' | 'high' | 'medium' } {
  const { yearlyLostRevenue, monthlyLostLeads } = estimate
  const formatted = formatRevenue(yearlyLostRevenue, city)

  if (yearlyLostRevenue > 50_000) return {
    headline: `${formatted}/an de CA potentiel non capturé`,
    subline:  `Soit ~${monthlyLostLeads} clients qui choisissent un concurrent chaque mois faute de visibilité digitale.`,
    urgency:  'critical',
  }
  if (yearlyLostRevenue > 15_000) return {
    headline: `${formatted}/an laissés sur la table`,
    subline:  `Environ ${monthlyLostLeads} prospects/mois vous trouvent trop tard — ou ne vous trouvent pas du tout.`,
    urgency:  'high',
  }
  return {
    headline: `${formatted}/an de potentiel inexploité`,
    subline:  `${monthlyLostLeads} clients potentiels/mois pourraient vous choisir avec une meilleure présence digitale.`,
    urgency:  'medium',
  }
}