/**
 * lib/audit-types.ts
 *
 * Types de scoring uniquement — pas de dépendances.
 * Les types wizard (AuditAnswers, QualificationData, etc.) sont dans @/types/audit.
 *
 * Séparé pour éviter la dépendance circulaire :
 *   scoring.ts → lost-clients.ts → (ici) → pas de retour
 */

export interface AuditScores {
  /** Score global pondéré sectoriel /100 */
  global:    number
  /** Score brut /100 — somme simple des 5 piliers */
  globalRaw: number
  social:    number
  web:       number
  gbp:       number
  funnel:    number
  branding:  number
}

export type ScoreLevel = 'red' | 'orange' | 'green'