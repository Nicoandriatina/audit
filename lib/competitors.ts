/**
 * lib/competitors.ts  — Sprint 3
 *
 * Génère 3 "concurrents locaux" fictifs mais crédibles à partir des benchmarks
 * sectoriels de sector-templates.ts.
 *
 * Design decisions :
 *  - Zéro API externe — données générées depuis les benchmarks sectoriels.
 *  - Génération déterministe via seed (auditId) → résultat identique à chaque appel.
 *  - Pas de dépendance sur lib/scoring.ts (évite le cycle de dépendances).
 *  - CompetitorResult est exporté pour usage dans les routes et composants.
 *
 * Chaîne d'imports :
 *   competitors.ts → sector-templates.ts  ✓
 *   competitors.ts → audit-types.ts       ✓
 *   competitors.ts → types/audit.ts       ✓ (AuditAnswers)
 *   competitors.ts → scoring.ts           ✗ (jamais)
 */

import { getSectorTemplate, type SectorTemplate } from './sector-templates'
import type { AuditScores } from './audit-types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompetitorResult {
  /** Nom générique du concurrent (jamais un vrai nom) */
  name:        string
  /** Score global estimé /100 */
  score:       number
  /** Score pilier social /20 */
  scoreSocial: number
  /** Score pilier web /20 */
  scoreWeb:    number
  /** Score pilier GBP /20 */
  scoreGBP:    number
  /** Score pilier funnel /20 */
  scoreFunnel: number
  /** Score pilier branding /20 */
  scoreBranding: number
  /** Points forts de ce concurrent (1-2 items) */
  strengths:   string[]
  /** Points faibles de ce concurrent (1-2 items) */
  weaknesses:  string[]
  /** Score client - score concurrent. Positif = vous êtes devant */
  delta:       number
  /** Label lisible de la position relative */
  rankLabel:   'En avance' | 'Au même niveau' | 'À dépasser'
  /** Couleur associée au rank */
  rankColor:   string
}

export interface CompetitorsAnalysis {
  competitors:     CompetitorResult[]
  /** Position du client dans le classement (1 = meilleur) */
  clientRank:      number
  /** Résumé textuel de la position concurrentielle */
  summary:         string
  /** Écart avec le meilleur concurrent */
  gapToLeader:     number
  /** Score moyen des 3 concurrents */
  avgCompetitorScore: number
}

// ─── Noms de concurrents génériques par secteur ───────────────────────────────

const COMPETITOR_NAMES: Record<string, string[][]> = {
  'restauration': [
    ['Le Bistrot du Centre', 'Brasserie des Halles', 'L\'Atelier Gourmand'],
    ['Chez Marcel', 'La Table du Chef', 'Au Coin de Rue'],
  ],
  'commerce': [
    ['Boutique Centrale', 'Commerce Moderne', 'L\'Enseigne Locale'],
    ['Le Magasin du Quartier', 'Tendances & Co', 'La Boutique en Vue'],
  ],
  'services-b2c': [
    ['Services Plus', 'L\'Expert Local', 'Prestation Pro'],
    ['ServiceNet', 'Assistance Locale', 'Pro Services'],
  ],
  'services-b2b': [
    ['ConseilPro', 'Solutions Entreprises', 'Cabinet Conseil Local'],
    ['BizConsult', 'Stratégie & Co', 'Experts Associés'],
  ],
  'artisanat': [
    ['Artisan Pro', 'Le Maître Artisan', 'Travaux Expert'],
    ['BâtiPro', 'Habitat Solutions', 'Rénovation Plus'],
  ],
  'sante': [
    ['Cabinet Santé Plus', 'Soins & Bien-être', 'Centre Médical Local'],
    ['PratiquesSanté', 'Clinique du Centre', 'Bien-être Naturel'],
  ],
  'liberal': [
    ['Cabinet Associé', 'Bureau Conseil', 'Expertise Libérale'],
    ['ConseilExpert', 'Cabinet Pro', 'Bureau d\'Études Local'],
  ],
  'immobilier': [
    ['Agence Immobilière Centrale', 'ImmoLocal', 'Résidence & Patrimoine'],
    ['Habitat Conseil', 'L\'Agence du Quartier', 'Pierre & Associés'],
  ],
  'beaute': [
    ['Institut Beauté', 'Salon Prestige', 'Beauty Center'],
    ['L\'Atelier Beauté', 'Coiffure & Soins', 'Studio Glamour'],
  ],
  'sport': [
    ['Salle Sport Plus', 'Fitness Center Local', 'Club Sportif'],
    ['GymPro', 'Sports Academy', 'Training Club'],
  ],
  'education': [
    ['Centre de Formation', 'École du Succès', 'Formation Pro Local'],
    ['LearnPro', 'Académie Locale', 'Institut Formation'],
  ],
  'transport': [
    ['Transport Express', 'Logistique Locale', 'Service Livraison Pro'],
    ['TransPro', 'Déménagement Plus', 'Fret Local'],
  ],
}

const DEFAULT_NAMES = [
  ['Concurrent A', 'Concurrent B', 'Concurrent C'],
  ['Leader Local', 'Établissement Central', 'Pro Secteur'],
]

// ─── Points forts / faibles types par secteur ─────────────────────────────────

const PILIER_STRENGTHS: Record<string, string> = {
  social:   'Présence réseaux sociaux active',
  web:      'Site web bien référencé',
  gbp:      'Fiche Google optimisée',
  funnel:   'Parcours client fluide',
  branding: 'Image de marque forte',
}

const PILIER_WEAKNESSES: Record<string, string> = {
  social:   'Peu actif sur les réseaux',
  web:      'Site web absent ou daté',
  gbp:      'Fiche Google peu optimisée',
  funnel:   'Pas de prise de RDV en ligne',
  branding: 'Image de marque générique',
}

// ─── Générateur pseudo-aléatoire déterministe (seed = auditId) ────────────────

function seededRandom(seed: string, index: number): number {
  let hash = 0
  const str = seed + index.toString()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Normaliser entre 0 et 1
  return Math.abs(hash) / 2147483647
}

/**
 * Génère une valeur dans [min, max] avec seed déterministe.
 */
function randInt(seed: string, index: number, min: number, max: number): number {
  return Math.round(min + seededRandom(seed, index) * (max - min))
}

// ─── Génération des scores piliers d'un concurrent ───────────────────────────

/**
 * Génère les scores piliers d'un concurrent à partir de son score global cible.
 * Les scores individuels sont distribués autour de la moyenne attendue,
 * avec variance contrôlée pour être réalistes.
 */
function generatePilierScores(
  seed: string,
  concurrentIndex: number,
  targetGlobal: number,
  template: SectorTemplate,
): Pick<CompetitorResult, 'scoreSocial' | 'scoreWeb' | 'scoreGBP' | 'scoreFunnel' | 'scoreBranding'> {
  // Score pilier moyen attendu pour atteindre ce global
  // targetGlobal = weighted_avg * 5, donc weighted_avg = targetGlobal / 5
  // On distribue en inversant la pondération (piliers forts du secteur → scores plus hauts)
  const { weights } = template
  const avgPilier = targetGlobal / 5 // score /20 moyen attendu

  // Variance : chaque pilier peut dévier de ±4 points
  const variance = 4

  const rawSocial   = Math.max(1, Math.min(20, Math.round(avgPilier * (weights.social   / 0.20) + (seededRandom(seed, concurrentIndex * 10 + 1) - 0.5) * variance * 2)))
  const rawWeb      = Math.max(1, Math.min(20, Math.round(avgPilier * (weights.web      / 0.20) + (seededRandom(seed, concurrentIndex * 10 + 2) - 0.5) * variance * 2)))
  const rawGBP      = Math.max(1, Math.min(20, Math.round(avgPilier * (weights.gbp      / 0.20) + (seededRandom(seed, concurrentIndex * 10 + 3) - 0.5) * variance * 2)))
  const rawFunnel   = Math.max(1, Math.min(20, Math.round(avgPilier * (weights.funnel   / 0.20) + (seededRandom(seed, concurrentIndex * 10 + 4) - 0.5) * variance * 2)))
  const rawBranding = Math.max(1, Math.min(20, Math.round(avgPilier * (weights.branding / 0.20) + (seededRandom(seed, concurrentIndex * 10 + 5) - 0.5) * variance * 2)))

  return {
    scoreSocial:   rawSocial,
    scoreWeb:      rawWeb,
    scoreGBP:      rawGBP,
    scoreFunnel:   rawFunnel,
    scoreBranding: rawBranding,
  }
}

/**
 * Détermine les points forts/faibles d'un concurrent à partir de ses scores piliers.
 */
function deriveConcurrentTags(piliers: Pick<CompetitorResult, 'scoreSocial' | 'scoreWeb' | 'scoreGBP' | 'scoreFunnel' | 'scoreBranding'>): {
  strengths: string[]
  weaknesses: string[]
} {
  const entries: Array<{ key: string; score: number }> = [
    { key: 'social',   score: piliers.scoreSocial },
    { key: 'web',      score: piliers.scoreWeb },
    { key: 'gbp',      score: piliers.scoreGBP },
    { key: 'funnel',   score: piliers.scoreFunnel },
    { key: 'branding', score: piliers.scoreBranding },
  ]

  const sorted = [...entries].sort((a, b) => b.score - a.score)

  const strengths  = sorted.slice(0, 2).filter(e => e.score >= 12).map(e => PILIER_STRENGTHS[e.key])
  const weaknesses = sorted.slice(-2).filter(e => e.score <= 10).map(e => PILIER_WEAKNESSES[e.key])

  return { strengths, weaknesses }
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Génère 3 concurrents fictifs crédibles basés sur les benchmarks sectoriels.
 *
 * Distribution des 3 concurrents :
 *  - Concurrent 1 : "Leader" — score autour du top quartile (difficile à battre)
 *  - Concurrent 2 : "Pair"   — score autour de la médiane sectorielle
 *  - Concurrent 3 : "Faible" — score légèrement en dessous de la moyenne
 *
 * @param auditId   Seed pour la génération déterministe
 * @param scores    Scores de l'audit client
 * @param sector    Secteur d'activité (ex: 'Restauration & Hôtellerie')
 */
export function generateCompetitors(
  auditId:  string,
  scores:   AuditScores,
  sector:   string,
): CompetitorsAnalysis {
  const template = getSectorTemplate(sector)
  const { avgScore, topQuartile, median } = template.benchmarks

  // ── 1. Déterminer les scores cibles des 3 concurrents ───────────────────
  // Concurrent 1 : leader sectoriel (top quartile ± variance)
  const leaderBase  = topQuartile + randInt(auditId, 100, -5, 8)
  // Concurrent 2 : concurrent moyen (médiane ± variance)
  const peerBase    = median + randInt(auditId, 200, -6, 6)
  // Concurrent 3 : concurrent faible (entre avg et médiane)
  const weakBase    = Math.round((avgScore + median) / 2) + randInt(auditId, 300, -4, 4)

  const targetScores = [
    Math.max(20, Math.min(95, leaderBase)),
    Math.max(15, Math.min(90, peerBase)),
    Math.max(10, Math.min(80, weakBase)),
  ]

  // ── 2. Choisir les noms ──────────────────────────────────────────────────
  const namePool = COMPETITOR_NAMES[template.id] ?? DEFAULT_NAMES
  const nameGroup = namePool[randInt(auditId, 400, 0, namePool.length - 1)]

  // ── 3. Générer chaque concurrent ────────────────────────────────────────
  const competitors: CompetitorResult[] = targetScores.map((targetScore, i) => {
    const piliers = generatePilierScores(auditId, i, targetScore, template)
    const { strengths, weaknesses } = deriveConcurrentTags(piliers)

    const delta = scores.global - targetScore

    let rankLabel: CompetitorResult['rankLabel']
    let rankColor: string
    if (delta > 5) {
      rankLabel = 'En avance'
      rankColor = '#2B9348'
    } else if (delta >= -5) {
      rankLabel = 'Au même niveau'
      rankColor = '#E8A020'
    } else {
      rankLabel = 'À dépasser'
      rankColor = '#E03131'
    }

    return {
      name:         nameGroup[i] ?? `Concurrent ${i + 1}`,
      score:        targetScore,
      ...piliers,
      strengths,
      weaknesses,
      delta,
      rankLabel,
      rankColor,
    }
  })

  // ── 4. Calculer la position du client dans le classement ─────────────────
  const allScores = [scores.global, ...competitors.map(c => c.score)].sort((a, b) => b - a)
  const clientRank = allScores.indexOf(scores.global) + 1

  // ── 5. Résumé textuel ────────────────────────────────────────────────────
  const avgCompetitorScore = Math.round(
    competitors.reduce((s, c) => s + c.score, 0) / competitors.length,
  )
  const gapToLeader = competitors[0].score - scores.global

  let summary: string
  if (clientRank === 1) {
    summary = `Vous êtes en tête de votre marché local avec ${scores.global}/100. Maintenez votre avance.`
  } else if (gapToLeader <= 10) {
    summary = `Vous êtes à ${gapToLeader} points du leader local. Quelques actions ciblées suffisent pour prendre la première place.`
  } else {
    summary = `Le leader local vous devance de ${gapToLeader} points. Un plan d'action structuré peut combler cet écart en 3 mois.`
  }

  return {
    competitors,
    clientRank,
    summary,
    gapToLeader: Math.max(0, gapToLeader),
    avgCompetitorScore,
  }
}