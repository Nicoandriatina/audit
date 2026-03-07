
/**
 * lib/recommendations.ts
 * Génère les 3 recommandations prioritaires à partir des scores + réponses.
 * Importé par /api/audit/unlock/route.ts
 */

import type { AuditAnswers, AuditScores, ActivityType } from './scoring'
import type { Recommendation } from '@/components/audit/Recommendations'

// ─── Règles de recommandation ─────────────────────────────────────────────────

interface RecoRule {
  pillar: string
  /** Condition pour déclencher la reco */
  condition: (answers: AuditAnswers, scores: AuditScores) => boolean
  priority: number
  problem: string
  businessImpact: string
  /** Peut dépendre du type d'activité */
  action: (activityType: ActivityType) => string
}

const RULES: RecoRule[] = [
  // ── Funnel ─────────────────────────────────────────────────────────────────
  {
    pillar: 'Acquisition & Funnel',
    priority: 1,
    condition: (a) => a.funnel.hasContactForm !== true,
    problem: 'Absence de formulaire de contact ou de devis en ligne',
    businessImpact: 'Vous perdez ~60% des visiteurs qui ne savent pas comment vous contacter — ils partent chez un concurrent.',
    action: () => 'Ajouter un formulaire de devis rapide (3 champs max) et un bouton d\'appel visible en haut de page.',
  },
  {
    pillar: 'Acquisition & Funnel',
    priority: 1,
    condition: (a) => a.funnel.hasVisibleCTA !== true,
    problem: 'Appels à l\'action (CTA) absents ou peu visibles sur le site',
    businessImpact: 'Sans CTA clair, vos visiteurs ne savent pas quoi faire — le taux de rebond explose.',
    action: () => 'Ajouter un CTA principal visible sur chaque page : "Demandez un devis gratuit" ou "Prenez rendez-vous".',
  },
  {
    pillar: 'Acquisition & Funnel',
    priority: 2,
    condition: (a) => a.funnel.hasOnlineBooking !== true,
    problem: 'Pas de prise de rendez-vous en ligne',
    businessImpact: '40% des clients préfèrent réserver en dehors des heures de bureau — vous perdez ces prospects.',
    action: () => 'Intégrer un outil de RDV en ligne (Cal.com, Calendly) sur votre site et votre fiche Google.',
  },
  {
    pillar: 'Acquisition & Funnel',
    priority: 3,
    condition: (a) => a.funnel.hasLeadTracking !== true,
    problem: 'Absence de suivi des leads (pas de CRM)',
    businessImpact: 'Sans processus de suivi, jusqu\'à 80% des prospects non-convertis immédiatement sont perdus.',
    action: () => 'Mettre en place un CRM simple (HubSpot gratuit, Notion) et un process de relance à J+2 et J+7.',
  },

  // ── Google Business Profile ────────────────────────────────────────────────
  {
    pillar: 'Google Business',
    priority: 1,
    condition: (a) => a.gbp.hasGBP === 'no' || a.gbp.hasGBP === '',
    problem: 'Fiche Google Business Profile inexistante',
    businessImpact: 'Vous êtes invisible dans Google Maps et les recherches locales "près de moi" — 46% des recherches sont locales.',
    action: () => 'Créer et optimiser votre fiche Google Business Profile (gratuit) avec photos, horaires et description.',
  },
  {
    pillar: 'Google Business',
    priority: 2,
    condition: (a) => {
      const low = ['0-5', '5-20'].includes(a.gbp.reviewCount ?? '')
      return a.gbp.hasGBP !== 'no' && low
    },
    problem: 'Nombre d\'avis Google insuffisant (moins de 20)',
    businessImpact: 'Les entreprises avec 50+ avis génèrent 3x plus de clics que celles avec moins de 10 avis.',
    action: () => 'Mettre en place une demande d\'avis automatique après chaque prestation (SMS ou email avec lien direct).',
  },
  {
    pillar: 'Google Business',
    priority: 2,
    condition: (a) => a.gbp.hasGBP !== 'no' && a.gbp.respondsToReviews === 'never',
    problem: 'Vous ne répondez jamais aux avis clients',
    businessImpact: 'Répondre aux avis augmente de 35% la confiance des prospects et améliore votre classement local.',
    action: () => 'Répondre à tous les avis sous 48h — remercier les positifs, traiter les négatifs professionnellement.',
  },

  // ── Présence Web ───────────────────────────────────────────────────────────
  {
    pillar: 'Présence Web & SEO',
    priority: 1,
    condition: (a) => a.web.hasWebsite !== true,
    problem: 'Absence de site web professionnel',
    businessImpact: '70% des consommateurs vérifient le site web d\'une entreprise avant de la contacter — sans site, vous perdez ces clients.',
    action: () => 'Créer un site vitrine professionnel (5 pages minimum) avec vos services, tarifs indicatifs et formulaire de contact.',
  },
  {
    pillar: 'Présence Web & SEO',
    priority: 2,
    condition: (a) => a.web.hasWebsite === true && a.web.isMobileFriendly !== 'yes',
    problem: 'Site non optimisé pour mobile',
    businessImpact: '60% du trafic web provient du mobile — Google pénalise les sites non-responsive dans ses résultats.',
    action: () => 'Faire auditer et corriger votre site pour le mobile (Google PageSpeed Insights donne un rapport gratuit).',
  },
  {
    pillar: 'Présence Web & SEO',
    priority: 3,
    condition: (a) => a.web.hasSEO !== true,
    problem: 'Absence de stratégie SEO ou de blog actif',
    businessImpact: 'Sans contenu SEO, vous êtes dépendant de la publicité payante pour générer du trafic.',
    action: () => 'Publier 1 article de blog par mois sur votre expertise pour attirer des clients en recherche active.',
  },

  // ── Réseaux sociaux ────────────────────────────────────────────────────────
  {
    pillar: 'Réseaux sociaux',
    priority: 2,
    condition: (a) => a.social.platforms.includes('none'),
    problem: 'Aucune présence sur les réseaux sociaux',
    businessImpact: 'Vos concurrents capturent votre audience sur les plateformes où vos clients passent 2h/jour en moyenne.',
    action: (type) =>
      type === 'B2B'
        ? 'Créer un profil LinkedIn professionnel et publier 2x/semaine sur votre expertise métier.'
        : 'Créer un compte Instagram et publier 3x/semaine avec des photos de vos réalisations.',
  },
  {
    pillar: 'Réseaux sociaux',
    priority: 3,
    condition: (a) => !a.social.platforms.includes('none') && (a.social.postsFrequency === 'rarely' || a.social.postsFrequency === 'never'),
    problem: 'Fréquence de publication insuffisante sur les réseaux',
    businessImpact: 'Les algorithmes réduisent de 40% la portée organique en cas de publication irrégulière.',
    action: (type) =>
      type === 'B2B'
        ? 'Planifier 2 posts LinkedIn par semaine avec un calendrier éditorial (insights secteur, cas clients).'
        : 'Planifier 3 posts Instagram par semaine : 1 réalisation, 1 coulisse, 1 témoignage client.',
  },

  // ── Branding ───────────────────────────────────────────────────────────────
  {
    pillar: 'Branding & Crédibilité',
    priority: 2,
    condition: (a) => a.branding.hasSocialProof !== true,
    problem: 'Pas de témoignages clients visibles',
    businessImpact: '92% des consommateurs lisent des avis avant d\'acheter — l\'absence de preuves sociales bloque la conversion.',
    action: () => 'Collecter 5 témoignages clients et les afficher sur votre site, vos réseaux et votre fiche Google.',
  },
  {
    pillar: 'Branding & Crédibilité',
    priority: 3,
    condition: (a) => a.branding.hasVisualConsistency !== 'yes',
    problem: 'Cohérence visuelle partielle ou absente entre supports',
    businessImpact: 'Une image incohérente réduit la mémorisation de marque de 50% et génère de la méfiance.',
    action: () => 'Créer un guide de marque simplifié : 2 couleurs, 1 police, 1 ton de voix — à appliquer partout.',
  },
  {
    pillar: 'Branding & Crédibilité',
    priority: 3,
    condition: (a) => a.branding.hasProfessionalPhotos !== true,
    problem: 'Pas de photos professionnelles de l\'entreprise',
    businessImpact: 'Les entreprises avec photos professionnelles reçoivent 42% plus de demandes de direction sur Google Maps.',
    action: () => 'Investir dans une session photo professionnelle : locaux, équipe, produits/services en action.',
  },
]

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateRecommendations(
  answers: AuditAnswers,
  scores: AuditScores,
  maxItems = 3,
): Recommendation[] {
  const activityType = answers.qualification.activityType

  const matched = RULES
    .filter((rule) => rule.condition(answers, scores))
    .map((rule) => ({
      pillar: rule.pillar,
      problem: rule.problem,
      businessImpact: rule.businessImpact,
      action: rule.action(activityType),
      priority: rule.priority,
    }))
    // Trier par priorité croissante, puis par score pilier croissant
    .sort((a, b) => a.priority - b.priority)

  // Dédupliquer par pilier (max 1 reco critique par pilier)
  const seen = new Set<string>()
  const deduplicated: Recommendation[] = []
  for (const reco of matched) {
    const key = `${reco.pillar}-${reco.priority}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(reco)
    }
    if (deduplicated.length >= maxItems) break
  }

  return deduplicated
}