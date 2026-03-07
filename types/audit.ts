export type ActivityType = 'B2B' | 'B2C'

export interface QualificationData {
  businessName: string
  city: string
  sector: string
  activityType: ActivityType
}

export interface SocialAnswers {
  platforms: string[]         // ['linkedin', 'instagram'] etc.
  linkedinUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
  followersRange?: string     // 'none' | 'low' | 'medium' | 'high'
  postsFrequency?: string     // 'never' | 'rarely' | 'weekly' | 'daily'
}

export interface WebAnswers {
  hasWebsite: boolean
  websiteUrl?: string
  isMobileFriendly?: boolean
  hasSEO?: boolean
  hasBlog?: boolean
}

export interface GBPAnswers {
  hasGBP: boolean
  reviewCount?: number
  averageRating?: number
  respondsToReviews?: boolean
  hasAutoReviewRequest?: boolean
}

export interface FunnelAnswers {
  hasContactForm: boolean
  hasVisibleCTA: boolean
  hasOnlineBooking: boolean
  hasLeadTracking: boolean
}

export interface BrandingAnswers {
  hasProfessionalLogo: boolean
  hasProfessionalPhotos: boolean
  hasVisualConsistency: boolean
  hasSocialProof: boolean
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

export interface Recommendation {
  pillar: string
  problem: string
  businessImpact: string
  action: string
  priority: number
}