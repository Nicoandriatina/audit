'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import QualificationForm, { type QualificationData } from '@/components/audit/QualificationForm'
import WizardStep, {
  YNButton,
  CheckboxCard,
  URLInput,
  QuestionSection,
  type PilierConfig,
} from '@/components/audit/WizardStep'
import AnalysisLoader from '@/components/audit/AnalysisLoader'

// ─── Types locaux ─────────────────────────────────────────────────────────────

type Screen = 'qualification' | 'wizard' | 'analysis'

type ActivityType = 'B2B' | 'B2C'

interface SocialAnswers {
  platforms: string[]
  instagramUrl: string
  linkedinUrl: string
  youtubeUrl: string
  postsFrequency: string
}

interface WebAnswers {
  hasWebsite: boolean | null
  websiteUrl: string
  isMobileFriendly: string
  hasSEO: boolean | null
}

interface GBPAnswers {
  hasGBP: string
  reviewCount: string
  averageRating: string
  respondsToReviews: string
}

interface FunnelAnswers {
  hasContactForm: boolean | null
  hasVisibleCTA: boolean | null
  hasOnlineBooking: boolean | null
  hasLeadTracking: boolean | null
}

interface BrandingAnswers {
  hasProfessionalLogo: boolean | null
  hasProfessionalPhotos: boolean | null
  hasVisualConsistency: string
  hasSocialProof: boolean | null
}

// ─── Piliers config (sidebar) ─────────────────────────────────────────────────

const PILIERS: PilierConfig[] = [
  {
    name: 'Réseaux sociaux',
    score: '/20 pts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'Présence Web & SEO',
    score: '/20 pts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    name: 'Google Business',
    score: '/20 pts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    name: 'Acquisition & Funnel',
    score: '/20 pts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    name: 'Branding & Crédibilité',
    score: '/20 pts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditStartPage() {
  const router = useRouter()

  // ── Global state ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('qualification')
  const [wizardStep, setWizardStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // ── Answers ───────────────────────────────────────────────────────────────
  const [qual, setQual] = useState<QualificationData>({
    businessName: '', city: '', sector: '', activityType: 'B2C',
  })

  const [social, setSocial] = useState<SocialAnswers>({
    platforms: [], instagramUrl: '', linkedinUrl: '', youtubeUrl: '', postsFrequency: '',
  })

  const [web, setWeb] = useState<WebAnswers>({
    hasWebsite: null, websiteUrl: '', isMobileFriendly: '', hasSEO: null,
  })

  const [gbp, setGBP] = useState<GBPAnswers>({
    hasGBP: '', reviewCount: '', averageRating: '', respondsToReviews: '',
  })

  const [funnel, setFunnel] = useState<FunnelAnswers>({
    hasContactForm: null, hasVisibleCTA: null, hasOnlineBooking: null, hasLeadTracking: null,
  })

  const [branding, setBranding] = useState<BrandingAnswers>({
    hasProfessionalLogo: null, hasProfessionalPhotos: null, hasVisualConsistency: '', hasSocialProof: null,
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleQualSubmit = (data: QualificationData) => {
    setQual(data)
    setScreen('wizard')
  }

  const handleWizardNext = () => {
    if (wizardStep < 4) {
      setWizardStep(wizardStep + 1)
    } else {
      setScreen('analysis')
    }
  }

  const handleWizardPrev = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1)
    } else {
      setScreen('qualification')
    }
  }

  const buildAnswers = () => ({
    qualification: qual,
    social,
    web,
    gbp,
    funnel,
    branding,
  })

  const handleAnalysisComplete = (auditId: string) => {
    router.push(`/audit/result?id=${auditId}`)
  }

  const handleAnalysisError = (msg: string) => {
    setError(msg)
    setScreen('wizard') // Retour au dernier pilier
    setWizardStep(4)
  }

  // ── Nav bar ───────────────────────────────────────────────────────────────

  const showNav = screen !== 'analysis'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F5F0E8', minHeight: '100vh' }}>

      {/* Nav */}
      {showNav && (
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 48px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#050A34',
          borderBottom: '1px solid rgba(175,233,253,0.1)',
        }}>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            color: 'white', textDecoration: 'none',
          }}>
            <span style={{
              width: 32, height: 32, background: '#085CF0', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: 'white',
            }}>CS</span>
            Cabinet Stratège
          </a>
          <a href="/audit" style={{
            fontSize: 13, color: '#AFE9FD', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour à l'audit
          </a>
        </nav>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          padding: '12px 48px',
          background: '#fef2f2', borderBottom: '1px solid #fca5a5',
          color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
        </div>
      )}

      {/* Main content — paddingTop pour la nav fixe */}
      <div style={{ paddingTop: screen !== 'analysis' ? 64 : 0 }}>

        {/* ── Screen: Qualification ─────────────────────────── */}
        {screen === 'qualification' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
          }}>
            <QualificationForm
              onSubmit={handleQualSubmit}
              defaultValues={qual}
              showBack={false}
            />
          </div>
        )}

        {/* ── Screen: Wizard ────────────────────────────────── */}
        {screen === 'wizard' && (
          <WizardStep
            currentStep={wizardStep}
            piliers={PILIERS}
            onNext={handleWizardNext}
            onPrev={handleWizardPrev}
            isLastStep={wizardStep === 4}
          >
            {wizardStep === 0 && (
              <Step0Social
                answers={social}
                activityType={qual.activityType}
                onChange={setSocial}
              />
            )}
            {wizardStep === 1 && (
              <Step1Web answers={web} onChange={setWeb} />
            )}
            {wizardStep === 2 && (
              <Step2GBP answers={gbp} onChange={setGBP} />
            )}
            {wizardStep === 3 && (
              <Step3Funnel answers={funnel} onChange={setFunnel} />
            )}
            {wizardStep === 4 && (
              <Step4Branding answers={branding} onChange={setBranding} />
            )}
          </WizardStep>
        )}

        {/* ── Screen: Analysis ─────────────────────────────── */}
        {screen === 'analysis' && (
          <AnalysisLoader
            answers={buildAnswers()}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
          />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS (intégrés dans la page pour éviter les imports supplémentaires)
// Chacun utilise YNButton, CheckboxCard, URLInput, QuestionSection de WizardStep
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Step 0 — Réseaux sociaux ─────────────────────────────────────────────────

function Step0Social({
  answers, activityType, onChange,
}: { answers: SocialAnswers; activityType: ActivityType; onChange: (a: SocialAnswers) => void }) {
  const isB2B = activityType === 'B2B'

  const togglePlatform = (p: string) => {
    if (p === 'none') {
      onChange({ ...answers, platforms: answers.platforms.includes('none') ? [] : ['none'] })
      return
    }
    const next = answers.platforms.filter((x) => x !== 'none')
    const updated = next.includes(p) ? next.filter((x) => x !== p) : [...next, p]
    onChange({ ...answers, platforms: updated })
  }

  const platforms = isB2B
    ? [
        { key: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon /> },
        { key: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
      ]
    : [
        { key: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
        { key: 'youtube', label: 'YouTube', icon: <YouTubeIcon /> },
      ]

  const showURLs = answers.platforms.length > 0 && !answers.platforms.includes('none')

  return (
    <>
      <h2 style={stepTitleStyle}>Réseaux sociaux</h2>
      <p style={stepSubStyle}>Évaluation de votre présence et de votre activité sur les plateformes clés.</p>

      <QuestionSection
        icon={<InstagramIcon size={14} />}
        label="Quelles plateformes utilisez-vous ?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {platforms.map((p) => (
            <CheckboxCard
              key={p.key}
              label={p.label}
              icon={p.icon}
              selected={answers.platforms.includes(p.key)}
              onClick={() => togglePlatform(p.key)}
            />
          ))}
          <CheckboxCard
            label="Aucun réseau social"
            icon={<NoneIcon />}
            selected={answers.platforms.includes('none')}
            onClick={() => togglePlatform('none')}
          />
        </div>
      </QuestionSection>

      {showURLs && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#050A34', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(8,92,240,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#085CF0', flexShrink: 0 }}>
              <LinkIcon size={14} />
            </span>
            URL de vos profils
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {answers.platforms.includes('instagram') && (
              <URLInput prefix="instagram.com/" placeholder="votre_compte" value={answers.instagramUrl} onChange={(v) => onChange({ ...answers, instagramUrl: v })} />
            )}
            {answers.platforms.includes('linkedin') && (
              <URLInput prefix="linkedin.com/in/" placeholder="votre-profil" value={answers.linkedinUrl} onChange={(v) => onChange({ ...answers, linkedinUrl: v })} />
            )}
            {answers.platforms.includes('youtube') && (
              <URLInput prefix="youtube.com/@" placeholder="votreChaine" value={answers.youtubeUrl} onChange={(v) => onChange({ ...answers, youtubeUrl: v })} />
            )}
          </div>
        </div>
      )}

      <QuestionSection
        icon={<ZapIcon size={14} />}
        label="Fréquence de publication"
      >
        {[
          { val: 'daily', label: 'Quotidienne' },
          { val: 'weekly', label: 'Hebdomadaire' },
          { val: 'rarely', label: 'Occasionnelle' },
          { val: 'never', label: 'Inactive / Aucune' },
        ].map(({ val, label }) => (
          <YNButton
            key={val}
            label={label}
            selected={answers.postsFrequency === val}
            onClick={() => onChange({ ...answers, postsFrequency: val })}
          />
        ))}
      </QuestionSection>
    </>
  )
}

// ─── Step 1 — Présence Web & SEO ─────────────────────────────────────────────

function Step1Web({
  answers, onChange,
}: { answers: WebAnswers; onChange: (a: WebAnswers) => void }) {
  return (
    <>
      <h2 style={stepTitleStyle}>Présence Web & SEO</h2>
      <p style={stepSubStyle}>Votre site web est votre vitrine — évaluons sa performance et sa visibilité.</p>

      <QuestionSection icon={<GlobeIcon size={14} />} label="Avez-vous un site web ?">
        <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.hasWebsite === true} onClick={() => onChange({ ...answers, hasWebsite: true })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasWebsite === false} onClick={() => onChange({ ...answers, hasWebsite: false })} />
      </QuestionSection>

      {answers.hasWebsite === true && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#050A34', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(8,92,240,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#085CF0', flexShrink: 0 }}>
              <LinkIcon size={14} />
            </span>
            URL de votre site
          </div>
          <URLInput prefix="https://" placeholder="www.votresite.fr" value={answers.websiteUrl} onChange={(v) => onChange({ ...answers, websiteUrl: v })} />
        </div>
      )}

      {answers.hasWebsite === true && (
        <QuestionSection
          icon={<MobileIcon size={14} />}
          label="Site adapté au mobile (responsive) ?"
        >
          <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.isMobileFriendly === 'yes'} onClick={() => onChange({ ...answers, isMobileFriendly: 'yes' })} />
          <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.isMobileFriendly === 'no'} onClick={() => onChange({ ...answers, isMobileFriendly: 'no' })} />
          <YNButton label="Je ne sais pas" selected={answers.isMobileFriendly === 'unknown'} onClick={() => onChange({ ...answers, isMobileFriendly: 'unknown' })} />
        </QuestionSection>
      )}

      <QuestionSection icon={<EditIcon size={14} />} label="Stratégie SEO ou blog actif ?">
        <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.hasSEO === true} onClick={() => onChange({ ...answers, hasSEO: true })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasSEO === false} onClick={() => onChange({ ...answers, hasSEO: false })} />
      </QuestionSection>
    </>
  )
}

// ─── Step 2 — Google Business Profile ─────────────────────────────────────────

function Step2GBP({
  answers, onChange,
}: { answers: GBPAnswers; onChange: (a: GBPAnswers) => void }) {
  const hasGBP = answers.hasGBP !== 'no' && answers.hasGBP !== ''

  return (
    <>
      <h2 style={stepTitleStyle}>Google Business Profile</h2>
      <p style={stepSubStyle}>Votre fiche Google est souvent le premier contact avec vos futurs clients.</p>

      <QuestionSection icon={<MapPinIcon size={14} />} label="Fiche Google Business Profile ?">
        {[
          { val: 'active', label: 'Oui, active et gérée' },
          { val: 'unmanaged', label: 'Oui, non gérée' },
          { val: 'no', label: 'Non' },
        ].map(({ val, label }) => (
          <YNButton key={val} label={label} selected={answers.hasGBP === val} onClick={() => onChange({ ...answers, hasGBP: val })} />
        ))}
      </QuestionSection>

      {hasGBP && (
        <>
          <QuestionSection
            icon={<UsersIcon size={14} />}
            label="Nombre d'avis Google"
          >
            {['0 – 5', '5 – 20', '20 – 50', '50+'].map((v) => {
              const key = v.replace(/\s/g, '')
              return (
                <YNButton key={key} label={v} selected={answers.reviewCount === key} onClick={() => onChange({ ...answers, reviewCount: key })} />
              )
            })}
          </QuestionSection>

          <QuestionSection icon={<StarIcon size={14} />} label="Note moyenne">
            {[
              { val: '<3.5', label: '< 3.5 ★' },
              { val: '3.5-4', label: '3.5 – 4 ★' },
              { val: '4-4.5', label: '4 – 4.5 ★' },
              { val: '4.5+', label: '4.5+ ★' },
            ].map(({ val, label }) => (
              <YNButton key={val} label={label} selected={answers.averageRating === val} onClick={() => onChange({ ...answers, averageRating: val })} />
            ))}
          </QuestionSection>

          <QuestionSection icon={<MessageIcon size={14} />} label="Répondez-vous aux avis client ?">
            {[
              { val: 'always', label: 'Systématiquement' },
              { val: 'sometimes', label: 'Parfois' },
              { val: 'never', label: 'Jamais' },
            ].map(({ val, label }) => (
              <YNButton key={val} label={label} selected={answers.respondsToReviews === val} onClick={() => onChange({ ...answers, respondsToReviews: val })} />
            ))}
          </QuestionSection>
        </>
      )}
    </>
  )
}

// ─── Step 3 — Acquisition & Funnel ────────────────────────────────────────────

function Step3Funnel({
  answers, onChange,
}: { answers: FunnelAnswers; onChange: (a: FunnelAnswers) => void }) {
  const questions: Array<{ key: keyof FunnelAnswers; label: string; icon: React.ReactNode }> = [
    { key: 'hasContactForm', label: 'Formulaire de contact ou devis en ligne ?', icon: <MailIcon size={14} /> },
    { key: 'hasVisibleCTA', label: 'CTAs clairs et visibles sur votre site ?', icon: <LightbulbIcon size={14} /> },
    { key: 'hasOnlineBooking', label: 'Prise de rendez-vous en ligne ?', icon: <CalendarIcon size={14} /> },
    { key: 'hasLeadTracking', label: 'Suivi des leads (CRM / process défini) ?', icon: <ZapIcon size={14} /> },
  ]

  return (
    <>
      <h2 style={stepTitleStyle}>Acquisition & Funnel</h2>
      <p style={stepSubStyle}>Votre capacité à transformer un visiteur en prospect, puis en client.</p>

      {questions.map(({ key, label, icon }) => (
        <QuestionSection key={key} icon={icon} label={label}>
          <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers[key] === true} onClick={() => onChange({ ...answers, [key]: true })} />
          <YNButton label="Non" icon={<XIcon size={16} />} selected={answers[key] === false} onClick={() => onChange({ ...answers, [key]: false })} />
        </QuestionSection>
      ))}
    </>
  )
}

// ─── Step 4 — Branding & Crédibilité ──────────────────────────────────────────

function Step4Branding({
  answers, onChange,
}: { answers: BrandingAnswers; onChange: (a: BrandingAnswers) => void }) {
  return (
    <>
      <h2 style={stepTitleStyle}>Branding & Crédibilité</h2>
      <p style={stepSubStyle}>L'image professionnelle qui inspire confiance à vos prospects dès le premier regard.</p>

      <QuestionSection icon={<StarIcon size={14} />} label="Logo professionnel ?">
        <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.hasProfessionalLogo === true} onClick={() => onChange({ ...answers, hasProfessionalLogo: true })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasProfessionalLogo === false} onClick={() => onChange({ ...answers, hasProfessionalLogo: false })} />
      </QuestionSection>

      <QuestionSection icon={<ImageIcon size={14} />} label="Photos professionnelles (locaux, équipe, produits) ?">
        <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.hasProfessionalPhotos === true} onClick={() => onChange({ ...answers, hasProfessionalPhotos: true })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasProfessionalPhotos === false} onClick={() => onChange({ ...answers, hasProfessionalPhotos: false })} />
      </QuestionSection>

      <QuestionSection icon={<SunIcon size={14} />} label="Cohérence visuelle sur tous vos supports ?">
        <YNButton label="Oui, complète" selected={answers.hasVisualConsistency === 'yes'} onClick={() => onChange({ ...answers, hasVisualConsistency: 'yes' })} />
        <YNButton label="Partielle" selected={answers.hasVisualConsistency === 'partial'} onClick={() => onChange({ ...answers, hasVisualConsistency: 'partial' })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasVisualConsistency === 'no'} onClick={() => onChange({ ...answers, hasVisualConsistency: 'no' })} />
      </QuestionSection>

      <QuestionSection icon={<MessageIcon size={14} />} label="Témoignages clients / preuves sociales visibles ?">
        <YNButton label="Oui" icon={<CheckIcon size={16} />} selected={answers.hasSocialProof === true} onClick={() => onChange({ ...answers, hasSocialProof: true })} />
        <YNButton label="Non" icon={<XIcon size={16} />} selected={answers.hasSocialProof === false} onClick={() => onChange({ ...answers, hasSocialProof: false })} />
      </QuestionSection>

      {/* Teaser card */}
      <div style={{
        marginTop: 8, padding: '20px 24px',
        background: 'rgba(8,92,240,0.04)', border: '1.5px solid rgba(8,92,240,0.15)',
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(8,92,240,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#085CF0', flexShrink: 0,
        }}>
          <CheckCircleIcon />
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#050A34', marginBottom: 3 }}>
            Prêt à lancer votre analyse ?
          </div>
          <div style={{ fontSize: 13, color: '#7A82A0' }}>
            Cliquez sur "Lancer l'analyse" pour obtenir votre score /100 et vos recommandations prioritaires.
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const stepTitleStyle: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
  color: '#050A34', marginBottom: 8,
}

const stepSubStyle: React.CSSProperties = {
  fontSize: 15, color: '#7A82A0', marginBottom: 40, lineHeight: 1.6,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MICRO ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const mkIcon = (path: string, extra?: string) =>
  ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {extra && <path d={extra} />}
      <path d={path} />
    </svg>
  )

const CheckIcon = mkIcon('M20 6L9 17l-5-5')
const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)
const MapPinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const ZapIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)
const StarIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const LinkIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
)
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const LinkedInIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
)
const YouTubeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
)
const NoneIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const MobileIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)
const EditIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const UsersIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)
const MessageIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)
const MailIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const LightbulbIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6M10 22h4" />
  </svg>
)
const CalendarIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const ImageIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
)
const SunIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
)
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)