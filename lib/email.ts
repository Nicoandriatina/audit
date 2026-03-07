/**
 * lib/email.ts
 * Envoi d'emails transactionnels via Resend.
 * Dépendance : npm install resend
 * Variable d'env : RESEND_API_KEY, NEXT_PUBLIC_APP_URL
 */

import { Resend } from 'resend'
import type { Recommendation } from '@/components/audit/Recommendations'
import { getScoreLevel, SCORE_LABELS, SCORE_MESSAGES } from './scoring'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM ?? 'Cabinet Stratège <audit@cabinet-stratege.ch>'
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'https://cal.com/cabinet-stratege'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SendAuditEmailParams {
  to: string
  fullName: string
  businessName: string
  city?: string
  auditId: string
  scoreGlobal: number
  scoreSocial: number
  scoreWeb: number
  scoreGBP: number
  scoreFunnel: number
  scoreBranding: number
  recommendations: Recommendation[]
}

// ─── Score color helper ───────────────────────────────────────────────────────

function scoreColor(score: number, outOf = 100): string {
  const pct = (score / outOf) * 100
  if (pct < 40) return '#E03131'
  if (pct < 70) return '#E8890C'
  return '#2B9348'
}

function pilierBar(score: number, max = 20): string {
  const pct = Math.round((score / max) * 100)
  const color = scoreColor(score, max)
  return `
    <div style="margin-bottom:14px;">
      <div style="height:6px;background:#EDE8DF;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;"></div>
      </div>
    </div>
  `
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildHtml(params: SendAuditEmailParams): string {
  const {
    fullName, businessName, city, auditId,
    scoreGlobal, scoreSocial, scoreWeb, scoreGBP, scoreFunnel, scoreBranding,
    recommendations,
  } = params

  const level = getScoreLevel(scoreGlobal)
  const levelLabel = SCORE_LABELS[level]
  const levelMessage = SCORE_MESSAGES[level]
  const globalColor = scoreColor(scoreGlobal)
  const resultUrl = `${APP_URL}/audit/result?id=${auditId}`
  const pdfUrl = `${APP_URL}/api/pdf/${auditId}`

  const piliers = [
    { name: 'Réseaux sociaux', score: scoreSocial },
    { name: 'Présence Web & SEO', score: scoreWeb },
    { name: 'Google Business', score: scoreGBP },
    { name: 'Acquisition & Funnel', score: scoreFunnel },
    { name: 'Branding & Crédibilité', score: scoreBranding },
  ]

  const recoItems = recommendations
    .map(
      (r, i) => `
      <div style="border:1.5px solid #EDE8DF;border-radius:12px;padding:18px 20px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;gap:14px;">
          <div style="width:28px;height:28px;border-radius:8px;background:${i === 0 ? 'rgba(224,49,49,0.1)' : i === 1 ? 'rgba(232,137,12,0.1)' : 'rgba(8,92,240,0.08)'};
            color:${i === 0 ? '#E03131' : i === 1 ? '#E8890C' : '#085CF0'};
            display:flex;align-items:center;justify-content:center;flex-shrink:0;
            font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;">
            P${i + 1}
          </div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:#050A34;margin-bottom:4px;">${r.problem}</div>
            <div style="font-size:12px;color:#7A82A0;margin-bottom:8px;">${r.businessImpact}</div>
            <div style="font-size:12px;color:#085CF0;font-weight:500;">→ ${r.action}</div>
          </div>
        </div>
      </div>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Votre rapport d'audit digital — Cabinet Stratège</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#050A34;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#050A34;border-radius:16px 16px 0 0;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <span style="display:inline-block;width:32px;height:32px;background:#085CF0;border-radius:8px;
                      color:white;font-size:13px;font-weight:900;text-align:center;line-height:32px;">CS</span>
                    <span style="font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:white;">Cabinet Stratège</span>
                  </div>
                </td>
              </tr>
              <tr><td style="padding-top:28px;">
                <h1 style="margin:0;font-size:26px;font-weight:800;color:white;line-height:1.2;">
                  Votre rapport d'audit digital est prêt
                </h1>
                <p style="margin:10px 0 0;font-size:14px;color:rgba(175,233,253,0.7);line-height:1.6;">
                  Bonjour ${fullName},<br>
                  Voici le diagnostic complet de la présence digitale de <strong style="color:rgba(175,233,253,0.9);">${businessName}${city ? ` — ${city}` : ''}</strong>.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Score band -->
        <tr>
          <td style="background:white;padding:36px 40px;border-top:1px solid #EDE8DF;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:100px;vertical-align:middle;">
                  <div style="width:88px;height:88px;border-radius:50%;border:6px solid ${globalColor};
                    display:flex;align-items:center;justify-content:center;background:white;text-align:center;
                    box-shadow:0 0 0 4px ${globalColor}20;">
                    <div>
                      <div style="font-size:30px;font-weight:800;color:${globalColor};line-height:1;">${scoreGlobal}</div>
                      <div style="font-size:11px;color:#7A82A0;">/100</div>
                    </div>
                  </div>
                </td>
                <td style="padding-left:24px;vertical-align:middle;">
                  <div style="display:inline-block;padding:4px 14px;border-radius:100px;
                    background:${level === 'red' ? 'rgba(224,49,49,0.08)' : level === 'orange' ? 'rgba(232,137,12,0.08)' : 'rgba(43,147,72,0.08)'};
                    color:${globalColor};font-size:12px;font-weight:600;margin-bottom:8px;">
                    ${levelLabel}
                  </div>
                  <p style="margin:0;font-size:14px;color:#7A82A0;line-height:1.6;">${levelMessage}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Piliers -->
        <tr>
          <td style="background:white;padding:0 40px 32px;border-top:1px solid #F5F0E8;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#092676;margin:0 0 20px;">
              Score par pilier
            </p>
            ${piliers
              .map(
                (p) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="font-size:13px;color:#050A34;font-weight:500;">${p.name}</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:${scoreColor(p.score, 20)};white-space:nowrap;">${p.score}/20</td>
                </tr>
                <tr><td colspan="2" style="padding-top:6px;">
                  <div style="height:6px;background:#EDE8DF;border-radius:3px;overflow:hidden;">
                    <div style="height:6px;width:${Math.round((p.score / 20) * 100)}%;background:${scoreColor(p.score, 20)};border-radius:3px;"></div>
                  </div>
                </td></tr>
              </table>
            `
              )
              .join('')}
          </td>
        </tr>

        <!-- Recommandations -->
        <tr>
          <td style="background:white;padding:0 40px 36px;border-top:1px solid #F5F0E8;">
            <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#092676;margin:0 0 20px;">
              Vos 3 priorités d'action
            </p>
            ${recoItems}
          </td>
        </tr>

        <!-- CTAs -->
        <tr>
          <td style="background:#050A34;padding:32px 40px;border-radius:0 0 16px 16px;">
            <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:white;text-align:center;">
              Transformez ce diagnostic en résultats concrets
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:10px;">
                  <a href="${resultUrl}" style="display:inline-block;background:#085CF0;color:white;
                    padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600;
                    text-decoration:none;letter-spacing:0.03em;">
                    Voir mon rapport complet →
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:10px;">
                  <a href="${CAL_LINK}" style="display:inline-block;background:none;color:rgba(175,233,253,0.7);
                    padding:12px 32px;border-radius:100px;font-size:13px;font-weight:500;
                    text-decoration:none;border:1px solid rgba(175,233,253,0.2);">
                    Réserver un diagnostic stratégique gratuit
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <a href="${pdfUrl}" style="display:inline-block;color:rgba(175,233,253,0.5);
                    font-size:12px;text-decoration:none;">
                    ↓ Télécharger le rapport PDF
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:11px;color:rgba(175,233,253,0.3);text-align:center;line-height:1.6;">
              Cabinet Stratège · Sion, Suisse<br>
              Cet email vous a été envoyé suite à votre audit digital gratuit.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function sendAuditEmail(params: SendAuditEmailParams): Promise<void> {
  const { to, fullName, businessName, scoreGlobal } = params

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Votre audit digital — Score ${scoreGlobal}/100 · ${businessName}`,
    html: buildHtml(params),
    replyTo: 'contact@cabinet-stratege.ch',
  })

  if (error) {
    console.error('[Resend] Failed to send audit email:', error)
    throw new Error(`Email error: ${error.message}`)
  }

  console.log(`[Resend] Audit email sent to ${to} (${businessName}, score: ${scoreGlobal})`)
}

/** Email interne de notification lead — envoyé à l'équipe Cabinet Stratège */
export async function sendLeadNotificationEmail(params: {
  fullName: string
  email: string
  phone: string
  businessName: string
  city?: string
  scoreGlobal: number
  auditId: string
}): Promise<void> {
  const { fullName, email, phone, businessName, city, scoreGlobal, auditId } = params

  await resend.emails.send({
    from: FROM_EMAIL,
    to: process.env.TEAM_EMAIL ?? 'contact@cabinet-stratege.ch',
    subject: `🎯 Nouveau lead audit — ${businessName} (${scoreGlobal}/100)`,
    html: `
      <h2>Nouveau lead débloqué</h2>
      <table>
        <tr><td><strong>Nom :</strong></td><td>${fullName}</td></tr>
        <tr><td><strong>Email :</strong></td><td>${email}</td></tr>
        <tr><td><strong>Téléphone :</strong></td><td>${phone}</td></tr>
        <tr><td><strong>Entreprise :</strong></td><td>${businessName}${city ? ` — ${city}` : ''}</td></tr>
        <tr><td><strong>Score :</strong></td><td>${scoreGlobal}/100</td></tr>
        <tr><td><strong>Rapport :</strong></td><td><a href="${APP_URL}/audit/result?id=${auditId}">Voir le rapport</a></td></tr>
      </table>
    `,
  })
}