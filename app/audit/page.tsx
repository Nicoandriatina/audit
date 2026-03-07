import type { Metadata } from 'next'
import IntroHero from '@/components/audit/IntroHero'
import AuditNav from '@/components/audit/AuditNav'

export const metadata: Metadata = {
  title: 'Audit Digital Gratuit — Cabinet Stratège',
  description: 'Obtenez un diagnostic complet de votre présence digitale en 5 minutes. Score /100, recommandations prioritaires et rapport PDF offert.',
  openGraph: {
    title: 'Audit Digital Gratuit — Cabinet Stratège',
    description: 'Découvrez votre score de visibilité digitale en 5 minutes. Diagnostic personnalisé, gratuit et immédiat.',
    type: 'website',
  },
}

export default function AuditPage() {
  return (
    <>
      <AuditNav />
      <IntroHero startUrl="/audit/start" />
    </>
  )
}