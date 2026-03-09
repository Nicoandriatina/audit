import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const sector   = searchParams.get('sector')   ?? undefined
  const unlocked = searchParams.get('unlocked') ?? undefined
  const search   = searchParams.get('search')?.trim() ?? undefined

  // ── Filtres Prisma ────────────────────────────────────────────────────────
  const where: Parameters<typeof prisma.audit.findMany>[0]['where'] = {}

  if (sector)              where.sector      = sector
  if (unlocked === 'true') where.isUnlocked  = true
  if (unlocked === 'false') where.isUnlocked = false
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: 'insensitive' } },
      { email:        { contains: search, mode: 'insensitive' } },
      { city:         { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    // ── Requêtes parallèles ───────────────────────────────────────────────
    const [audits, total, allStats] = await Promise.all([

      // Liste paginée
      prisma.audit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id:              true,
          createdAt:       true,
          businessName:    true,
          city:            true,
          sector:          true,
          activityType:    true,
          scoreGlobal:     true,
          scoreSocial:     true,
          scoreWeb:        true,
          scoreGBP:        true,
          scoreFunnel:     true,
          scoreBranding:   true,
          sectorPercentile: true,
          isUnlocked:      true,
          fullName:        true,
          email:           true,
          phone:           true,
          // On exclut answersJSON, lostClientsJSON, competitorsJSON (trop lourds pour la liste)
        },
      }),

      // Total pour la pagination
      prisma.audit.count({ where }),

      // Stats globales (sans filtre — toujours sur l'ensemble)
      prisma.audit.aggregate({
        _avg:   { scoreGlobal: true },
        _count: { _all: true },
      }),
    ])

    // ── Stats complémentaires ─────────────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [unlockedCount, last7DaysCount, sectorDistribution] = await Promise.all([
      prisma.audit.count({ where: { isUnlocked: true } }),
      prisma.audit.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.audit.groupBy({
        by: ['sector'],
        _count: { _all: true },
        orderBy: { _count: { sector: 'desc' } },
        take: 5,
      }),
    ])

    const totalAudits    = allStats._count._all
    const conversionRate = totalAudits > 0
      ? Math.round((unlockedCount / totalAudits) * 100)
      : 0

    return NextResponse.json({
      audits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalAudits,
        scoreAvg:        Math.round(allStats._avg.scoreGlobal ?? 0),
        totalUnlocked:   unlockedCount,
        last7Days:       last7DaysCount,
        conversionRate,
        topSectors:      sectorDistribution.map(s => ({
          sector: s.sector || 'Non renseigné',
          count:  s._count._all,
        })),
      },
    })
  } catch (err) {
    console.error('[/api/admin/audits]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}