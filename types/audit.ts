
export type ActivityType = 'B2B' | 'B2C'

export interface QualificationData {
  businessName: string
  city:         string
  sector:       string
  activityType: ActivityType
}

// ─── Pilier 1 — Réseaux sociaux ───────────────────────────────────────────────

export interface SocialAnswers {
  platforms:       string[]
  linkedinUrl?:    string
  instagramUrl?:   string
  youtubeUrl?:     string
  followersRange?: 'none' | 'low' | 'medium' | 'high' | ''
  postsFrequency:  'daily' | 'weekly' | 'rarely' | 'never' | ''
}

// ─── Pilier 2 — Présence web ──────────────────────────────────────────────────

export interface WebAnswers {
  hasWebsite:       boolean | null
  websiteUrl?:      string
  isMobileFriendly: 'yes' | 'no' | 'unknown' | ''
  hasSEO:           boolean | null
}

// ─── Pilier 3 — Google Business Profile ──────────────────────────────────────

export interface GBPAnswers {
  hasGBP:            'active' | 'unmanaged' | 'no' | ''
  reviewCount:       '0-5' | '5-20' | '20-50' | '50+' | ''
  averageRating:     '<3.5' | '3.5-4' | '4-4.5' | '4.5+' | ''
  respondsToReviews: 'always' | 'sometimes' | 'never' | ''
}

// ─── Pilier 4 — Acquisition / Funnel ─────────────────────────────────────────

export interface FunnelAnswers {
  hasContactForm:   boolean | null
  hasVisibleCTA:    boolean | null
  hasOnlineBooking: boolean | null
  hasLeadTracking:  boolean | null
}

// ─── Pilier 5 — Branding & Crédibilité ───────────────────────────────────────

export interface BrandingAnswers {
  hasProfessionalLogo:   boolean | null
  hasProfessionalPhotos: boolean | null
  hasVisualConsistency:  'yes' | 'partial' | 'no' | ''
  hasSocialProof:        boolean | null
}

// ─── Réponses complètes du wizard ────────────────────────────────────────────

export interface AuditAnswers {
  qualification: QualificationData
  social:        SocialAnswers
  web:           WebAnswers
  gbp:           GBPAnswers
  funnel:        FunnelAnswers
  branding:      BrandingAnswers
}