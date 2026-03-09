
// ─── Types ────────────────────────────────────────────────────────────────────

export interface PilierWeights {
  social:   number  // doit sommer à 1.0 avec les autres
  web:      number
  gbp:      number
  funnel:   number
  branding: number
}

export interface BonusRule {
  id:          string
  description: string
  /** Retourne le nombre de points bonus (0 si règle non applicable) */
  evaluate: (answers: SectorBonusContext) => number
}

export interface SectorBonusContext {
  activityType:       'B2B' | 'B2C'
  hasGBP:             string
  reviewCount:        string
  averageRating:      string
  respondsToReviews:  string
  hasOnlineBooking:   boolean | null
  hasWebsite:         boolean | null
  hasSEO:             boolean | null
  platforms:          string[]
  postsFrequency:     string
  hasProfessionalPhotos: boolean | null
  hasSocialProof:     boolean | null
  hasContactForm:     boolean | null
}

export interface SectorBenchmarks {
  /** Score moyen du secteur /100 */
  avgScore:        number
  /** Score du top 25% du secteur */
  topQuartile:     number
  /** Score médian */
  median:          number
}

export interface LostClientsParams {
  /**
   * Taux mensuel de recherches locales estimé selon la taille de ville
   * (nombre de recherches/mois pour une ville de 100k habitants)
   */
  monthlySearchesPerCapita: number
  /**
   * Taux de conversion moyen du secteur (visiteur → contact)
   * Ex: 0.03 = 3% des visiteurs deviennent des leads
   */
  avgConversionRate: number
  /**
   * Ticket moyen par client (€)
   */
  avgTicketEur: number
  /**
   * Nombre moyen de clients récurrents par an
   */
  avgRetentionMultiplier: number
}

export interface SectorTemplate {
  /** Clé unique — doit correspondre exactement aux valeurs du select QualificationForm */
  id:           string
  label:        string
  weights:      PilierWeights
  bonusRules:   BonusRule[]
  benchmarks:   SectorBenchmarks
  lostClients:  LostClientsParams
  /** Conseils spécifiques au secteur pour les recommandations */
  sectorTips:   Record<string, string>
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const SECTOR_TEMPLATES: Record<string, SectorTemplate> = {

  'Restauration & Hôtellerie': {
    id: 'restauration',
    label: 'Restauration & Hôtellerie',
    // GBP ultra-critique (avis = décision d'achat immédiate)
    // Social important (photos de plats = marketing)
    // Web moins critique (GBP remplace souvent le site)
    weights: { social: 0.22, web: 0.15, gbp: 0.32, funnel: 0.15, branding: 0.16 },
    benchmarks: { avgScore: 42, topQuartile: 71, median: 45 },
    lostClients: {
      monthlySearchesPerCapita: 0.18,
      avgConversionRate: 0.12,
      avgTicketEur: 35,
      avgRetentionMultiplier: 8,
    },
    bonusRules: [
      {
        id: 'resto-photos',
        description: 'Photos pro sur fiche Google = boost visibilité',
        evaluate: (ctx) => ctx.hasProfessionalPhotos === true && ctx.hasGBP !== 'no' ? 2 : 0,
      },
      {
        id: 'resto-rating-excellent',
        description: 'Note 4.5+ = avantage concurrentiel fort',
        evaluate: (ctx) => ctx.averageRating === '4.5+' ? 3 : 0,
      },
      {
        id: 'resto-responds',
        description: 'Répond systématiquement aux avis',
        evaluate: (ctx) => ctx.respondsToReviews === 'always' ? 2 : 0,
      },
    ],
    sectorTips: {
      gbp:      'Ajouter le menu complet et les photos de plats sur votre fiche Google.',
      social:   'Instagram Stories quotidiennes des plats du jour — fort engagement local.',
      funnel:   'Intégrer TheFork, Google Reserve ou LaFourchette pour la réservation en ligne.',
      branding: 'Photos professionnelles de vos plats = +42% de clics sur votre fiche Google.',
    },
  },

  'Commerce de détail': {
    id: 'commerce',
    label: 'Commerce de détail',
    weights: { social: 0.22, web: 0.20, gbp: 0.25, funnel: 0.18, branding: 0.15 },
    benchmarks: { avgScore: 38, topQuartile: 65, median: 40 },
    lostClients: {
      monthlySearchesPerCapita: 0.14,
      avgConversionRate: 0.08,
      avgTicketEur: 55,
      avgRetentionMultiplier: 6,
    },
    bonusRules: [
      {
        id: 'commerce-ecommerce',
        description: 'Présence e-commerce ou catalogue en ligne',
        evaluate: (ctx) => ctx.hasWebsite === true && ctx.hasSEO === true ? 2 : 0,
      },
      {
        id: 'commerce-social-active',
        description: 'Présence Instagram active pour le commerce',
        evaluate: (ctx) =>
          ctx.platforms.includes('instagram') && ctx.postsFrequency === 'daily' ? 3 : 0,
      },
    ],
    sectorTips: {
      web:      'Créer un catalogue en ligne (même sans paiement) pour montrer vos produits.',
      social:   'Publier vos nouveautés sur Instagram avec des Reels courts — algorithme favorable.',
      gbp:      'Activer "Produits" dans votre fiche Google pour afficher votre catalogue.',
      funnel:   'Ajouter un bouton "Réserver / Commander" directement sur la fiche Google.',
    },
  },

  'Services aux particuliers': {
    id: 'services-b2c',
    label: 'Services aux particuliers',
    weights: { social: 0.18, web: 0.20, gbp: 0.28, funnel: 0.20, branding: 0.14 },
    benchmarks: { avgScore: 35, topQuartile: 62, median: 37 },
    lostClients: {
      monthlySearchesPerCapita: 0.10,
      avgConversionRate: 0.07,
      avgTicketEur: 120,
      avgRetentionMultiplier: 4,
    },
    bonusRules: [
      {
        id: 'services-booking',
        description: 'Réservation en ligne = avantage concurrentiel critique',
        evaluate: (ctx) => ctx.hasOnlineBooking === true ? 3 : 0,
      },
      {
        id: 'services-social-proof',
        description: 'Témoignages clients = rassurance décisive',
        evaluate: (ctx) => ctx.hasSocialProof === true ? 2 : 0,
      },
    ],
    sectorTips: {
      funnel:   'Intégrer Cal.com ou Calendly — 40% des clients réservent hors horaires de bureau.',
      gbp:      'Mettre à jour la section "Services" et "Questions/Réponses" de votre fiche.',
      branding: 'Afficher les certifications et labels de qualité sur chaque page.',
      web:      'Créer une page dédiée par service avec photos avant/après.',
    },
  },

  'Services aux entreprises (B2B)': {
    id: 'services-b2b',
    label: 'Services aux entreprises (B2B)',
    // B2B : Web + Funnel critiques, GBP moins important
    // LinkedIn remplace Instagram
    weights: { social: 0.18, web: 0.28, gbp: 0.12, funnel: 0.28, branding: 0.14 },
    benchmarks: { avgScore: 40, topQuartile: 68, median: 43 },
    lostClients: {
      monthlySearchesPerCapita: 0.04,
      avgConversionRate: 0.04,
      avgTicketEur: 2500,
      avgRetentionMultiplier: 3,
    },
    bonusRules: [
      {
        id: 'b2b-linkedin',
        description: 'LinkedIn actif = canal prioritaire B2B',
        evaluate: (ctx) =>
          ctx.platforms.includes('linkedin') && ctx.postsFrequency !== 'never' ? 3 : 0,
      },
      {
        id: 'b2b-crm',
        description: 'CRM + suivi leads = différenciateur B2B',
        evaluate: (_ctx) => 0, // handled in funnel score — no double-count
      },
      {
        id: 'b2b-case-studies',
        description: 'Études de cas / témoignages clients B2B',
        evaluate: (ctx) => ctx.hasSocialProof === true ? 3 : 0,
      },
    ],
    sectorTips: {
      web:      'Créer des landing pages par problème client (pas par service) — meilleur SEO B2B.',
      funnel:   'Mettre en place un lead magnet (audit, checklist, template) pour capturer des emails.',
      social:   'LinkedIn : partager des insights sectoriels, pas des promotions — x3 engagement.',
      branding: 'Publier des études de cas clients avec chiffres concrets sur le site et LinkedIn.',
    },
  },

  'Artisanat & Bâtiment': {
    id: 'artisanat',
    label: 'Artisanat & Bâtiment',
    // GBP critique (recherche "plombier près de moi")
    // Photos pro = portfolio = conversion
    weights: { social: 0.15, web: 0.18, gbp: 0.35, funnel: 0.18, branding: 0.14 },
    benchmarks: { avgScore: 28, topQuartile: 55, median: 30 },
    lostClients: {
      monthlySearchesPerCapita: 0.12,
      avgConversionRate: 0.15,
      avgTicketEur: 850,
      avgRetentionMultiplier: 2,
    },
    bonusRules: [
      {
        id: 'artisan-photos-work',
        description: 'Photos de réalisations = portfolio = conversion',
        evaluate: (ctx) => ctx.hasProfessionalPhotos === true ? 3 : 0,
      },
      {
        id: 'artisan-reviews-volume',
        description: 'Volume d\'avis critiques pour l\'artisanat',
        evaluate: (ctx) => ctx.reviewCount === '50+' ? 3 : ctx.reviewCount === '20-50' ? 1 : 0,
      },
      {
        id: 'artisan-devis-online',
        description: 'Devis en ligne = avantage massif dans ce secteur',
        evaluate: (ctx) => ctx.hasContactForm === true ? 2 : 0,
      },
    ],
    sectorTips: {
      gbp:      'Publier des photos avant/après sur votre fiche Google après chaque chantier.',
      funnel:   'Ajouter un formulaire de devis en 3 étapes (type de travaux, surface, urgence).',
      branding: 'Créer un portfolio de réalisations avec localisation — preuve de compétence locale.',
      social:   'Instagram : avant/après chantiers — format Reels très viral dans ce secteur.',
    },
  },

  'Santé & Bien-être': {
    id: 'sante',
    label: 'Santé & Bien-être',
    weights: { social: 0.18, web: 0.18, gbp: 0.25, funnel: 0.25, branding: 0.14 },
    benchmarks: { avgScore: 44, topQuartile: 70, median: 46 },
    lostClients: {
      monthlySearchesPerCapita: 0.08,
      avgConversionRate: 0.10,
      avgTicketEur: 75,
      avgRetentionMultiplier: 12,
    },
    bonusRules: [
      {
        id: 'sante-booking',
        description: 'RDV en ligne = standard attendu dans la santé',
        evaluate: (ctx) => ctx.hasOnlineBooking === true ? 4 : 0,
      },
      {
        id: 'sante-social-proof',
        description: 'Témoignages = confiance dans le secteur santé',
        evaluate: (ctx) => ctx.hasSocialProof === true && ctx.averageRating === '4.5+' ? 3 : 0,
      },
    ],
    sectorTips: {
      funnel:   'Intégrer un système de RDV en ligne (Doctolib, Cal.com) — standard dans le secteur.',
      gbp:      'Mettre à jour vos spécialités et zones d\'intervention dans la fiche Google.',
      branding: 'Certifications, diplômes et assurance RC Pro visibles = réassurance patient.',
      social:   'Conseils prévention et bien-être en vidéo courte = fort engagement Instagram.',
    },
  },

  'Professions libérales': {
    id: 'liberal',
    label: 'Professions libérales',
    weights: { social: 0.14, web: 0.25, gbp: 0.18, funnel: 0.25, branding: 0.18 },
    benchmarks: { avgScore: 38, topQuartile: 64, median: 40 },
    lostClients: {
      monthlySearchesPerCapita: 0.05,
      avgConversionRate: 0.06,
      avgTicketEur: 300,
      avgRetentionMultiplier: 5,
    },
    bonusRules: [
      {
        id: 'liberal-expertise',
        description: 'Blog/contenu expertise = SEO + autorité',
        evaluate: (ctx) => ctx.hasSEO === true ? 3 : 0,
      },
      {
        id: 'liberal-social-proof',
        description: 'Témoignages clients = déclencheur de confiance',
        evaluate: (ctx) => ctx.hasSocialProof === true ? 2 : 0,
      },
    ],
    sectorTips: {
      web:      'Publier des articles sur votre domaine d\'expertise — SEO longue traîne très efficace.',
      funnel:   'Offrir une consultation découverte gratuite de 30 min pour réduire la barrière à l\'entrée.',
      branding: 'Page "À propos" détaillée avec parcours, valeurs et philosophie de travail.',
      social:   'LinkedIn : partager votre expertise avec des analyses de cas (anonymisées).',
    },
  },

  'Immobilier': {
    id: 'immobilier',
    label: 'Immobilier',
    weights: { social: 0.16, web: 0.26, gbp: 0.20, funnel: 0.24, branding: 0.14 },
    benchmarks: { avgScore: 46, topQuartile: 72, median: 48 },
    lostClients: {
      monthlySearchesPerCapita: 0.06,
      avgConversionRate: 0.04,
      avgTicketEur: 8000,
      avgRetentionMultiplier: 1.5,
    },
    bonusRules: [
      {
        id: 'immo-listing',
        description: 'Annonces bien référencées avec photos pro',
        evaluate: (ctx) => ctx.hasProfessionalPhotos === true && ctx.hasWebsite === true ? 3 : 0,
      },
    ],
    sectorTips: {
      web:      'Intégrer des visites virtuelles 360° et des vidéos de biens — x3 temps passé sur le site.',
      funnel:   'Ajouter une estimation en ligne (simulateur de prix) — lead magnet très efficace en immo.',
      social:   'Instagram Reels de visites guidées de biens — format le plus performant du secteur.',
      gbp:      'Publier régulièrement les biens vendus avec photos — preuve de volume d\'activité.',
    },
  },

  'Beauté & Esthétique': {
    id: 'beaute',
    label: 'Beauté & Esthétique',
    weights: { social: 0.28, web: 0.14, gbp: 0.25, funnel: 0.18, branding: 0.15 },
    benchmarks: { avgScore: 40, topQuartile: 69, median: 42 },
    lostClients: {
      monthlySearchesPerCapita: 0.14,
      avgConversionRate: 0.11,
      avgTicketEur: 65,
      avgRetentionMultiplier: 10,
    },
    bonusRules: [
      {
        id: 'beaute-instagram',
        description: 'Instagram = vitrine principale dans ce secteur',
        evaluate: (ctx) =>
          ctx.platforms.includes('instagram') && ctx.postsFrequency === 'daily' ? 4 : 0,
      },
      {
        id: 'beaute-booking-online',
        description: 'Réservation en ligne = standard attendu',
        evaluate: (ctx) => ctx.hasOnlineBooking === true ? 3 : 0,
      },
    ],
    sectorTips: {
      social:   'Publier les transformations avant/après quotidiennement sur Instagram Reels — viralité maximale.',
      funnel:   'Planity, Treatwell ou Calendly : 60% des réservations beauté se font en dehors des horaires.',
      gbp:      'Activer la réservation directe depuis Google Maps (intégration Planity/Treatwell).',
      branding: 'Palette de couleurs cohérente sur tous vos supports = reconnaissance de marque immédiate.',
    },
  },

  'Sport & Fitness': {
    id: 'sport',
    label: 'Sport & Fitness',
    weights: { social: 0.26, web: 0.16, gbp: 0.20, funnel: 0.22, branding: 0.16 },
    benchmarks: { avgScore: 38, topQuartile: 65, median: 40 },
    lostClients: {
      monthlySearchesPerCapita: 0.09,
      avgConversionRate: 0.09,
      avgTicketEur: 80,
      avgRetentionMultiplier: 10,
    },
    bonusRules: [
      {
        id: 'sport-community',
        description: 'Communauté active sur les réseaux = rétention',
        evaluate: (ctx) =>
          (ctx.platforms.includes('instagram') || ctx.platforms.includes('youtube')) &&
          ctx.postsFrequency === 'daily' ? 3 : 0,
      },
    ],
    sectorTips: {
      social:   'Challenges, transformations, conseils quotidiens — communauté = meilleure publicité.',
      funnel:   'Offrir un cours d\'essai gratuit avec inscription en ligne pour réduire les freins.',
      web:      'Créer une page dédiée aux résultats clients avec photos et témoignages vidéo.',
      gbp:      'Publier les horaires de cours, événements spéciaux et offres de rentrée.',
    },
  },

  'Éducation & Formation': {
    id: 'education',
    label: 'Éducation & Formation',
    weights: { social: 0.16, web: 0.28, gbp: 0.14, funnel: 0.26, branding: 0.16 },
    benchmarks: { avgScore: 42, topQuartile: 70, median: 44 },
    lostClients: {
      monthlySearchesPerCapita: 0.04,
      avgConversionRate: 0.05,
      avgTicketEur: 1200,
      avgRetentionMultiplier: 1.5,
    },
    bonusRules: [
      {
        id: 'edu-content',
        description: 'Contenu éducatif gratuit = acquisition organique',
        evaluate: (ctx) => ctx.hasSEO === true ? 3 : 0,
      },
    ],
    sectorTips: {
      web:      'Créer des pages de cours détaillées avec programme, pré-requis et témoignages alumni.',
      funnel:   'Proposer un module gratuit ou un webinaire découverte comme lead magnet.',
      social:   'YouTube : tutoriels gratuits courts = meilleur canal d\'acquisition en formation.',
      branding: 'Certifications, accréditations et taux de succès des apprenants en avant-plan.',
    },
  },

  'Transport & Logistique': {
    id: 'transport',
    label: 'Transport & Logistique',
    weights: { social: 0.12, web: 0.24, gbp: 0.20, funnel: 0.30, branding: 0.14 },
    benchmarks: { avgScore: 32, topQuartile: 58, median: 34 },
    lostClients: {
      monthlySearchesPerCapita: 0.03,
      avgConversionRate: 0.06,
      avgTicketEur: 450,
      avgRetentionMultiplier: 4,
    },
    bonusRules: [
      {
        id: 'transport-devis',
        description: 'Devis en ligne = avantage décisif dans ce secteur',
        evaluate: (ctx) => ctx.hasContactForm === true ? 3 : 0,
      },
    ],
    sectorTips: {
      funnel:   'Calculateur de devis en ligne avec zones de couverture interactives = conversion x2.',
      web:      'Page zones desservies avec carte — SEO local très efficace dans le transport.',
      gbp:      'Publier vos certifications transport et assurances — réassurance décisive.',
      branding: 'Témoignages clients B2B avec noms d\'entreprises (si accord) = crédibilité immédiate.',
    },
  },

  'Autre': {
    id: 'autre',
    label: 'Autre',
    // Poids équilibrés par défaut
    weights: { social: 0.20, web: 0.20, gbp: 0.20, funnel: 0.20, branding: 0.20 },
    benchmarks: { avgScore: 38, topQuartile: 63, median: 40 },
    lostClients: {
      monthlySearchesPerCapita: 0.06,
      avgConversionRate: 0.06,
      avgTicketEur: 200,
      avgRetentionMultiplier: 3,
    },
    bonusRules: [],
    sectorTips: {},
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Récupère le template d'un secteur, avec fallback sur 'Autre'.
 */
export function getSectorTemplate(sector: string): SectorTemplate {
  return SECTOR_TEMPLATES[sector] ?? SECTOR_TEMPLATES['Autre']
}

/**
 * Calcule le score global pondéré selon le template sectoriel.
 * Retourne un score /100 (arrondi).
 *
 * Formule :
 *   weightedScore = Σ (scoreRaw_i * weight_i) * 5
 *   (× 5 car chaque pilier est /20 et on veut ramener à /100)
 */
export function calculateWeightedScore(
  rawScores: { social: number; web: number; gbp: number; funnel: number; branding: number },
  template: SectorTemplate,
  bonusContext: SectorBonusContext,
): number {
  const { weights, bonusRules } = template

  // Score pondéré de base
  const weightedRaw =
    rawScores.social   * weights.social   +
    rawScores.web      * weights.web      +
    rawScores.gbp      * weights.gbp      +
    rawScores.funnel   * weights.funnel   +
    rawScores.branding * weights.branding

  // Normaliser : chaque pilier est /20, on veut un score /100
  // weightedRaw max = 20 * (sum of weights) = 20 * 1.0 = 20
  const baseScore = weightedRaw * 5

  // Points bonus
  const bonusPoints = bonusRules.reduce((sum, rule) => sum + rule.evaluate(bonusContext), 0)

  return Math.min(100, Math.round(baseScore + bonusPoints))
}

/**
 * Calcule le percentile d'un score dans le secteur.
 * Retourne un string type "Meilleur que 73% des entreprises de votre secteur"
 */
export function getSectorPercentile(score: number, template: SectorTemplate): {
  percentile: number
  label: string
} {
  const { avgScore, topQuartile, median } = template.benchmarks

  let percentile: number
  if (score >= topQuartile) {
    percentile = Math.round(75 + ((score - topQuartile) / (100 - topQuartile)) * 25)
  } else if (score >= median) {
    percentile = Math.round(50 + ((score - median) / (topQuartile - median)) * 25)
  } else if (score >= avgScore) {
    percentile = Math.round(40 + ((score - avgScore) / (median - avgScore)) * 10)
  } else {
    percentile = Math.round((score / avgScore) * 40)
  }

  percentile = Math.max(5, Math.min(99, percentile))

  const label = percentile >= 75
    ? `Top ${100 - percentile}% de votre secteur`
    : `Meilleur que ${percentile}% des entreprises de votre secteur`

  return { percentile, label }
}