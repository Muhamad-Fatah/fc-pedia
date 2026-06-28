import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { PlayerStats } from '@/components/PlayerStats'
import type { Player, PlayerAbility } from '@/lib/types'
import type { Row } from '@libsql/client'

function rowToPlayer(row: Row): Player {
  return {
    id: row.id as string,
    rank: row.rank as number,
    overallRating: row.overall_rating as number,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    commonName: row.common_name as string,
    birthdate: row.birthdate as string,
    height: row.height as number,
    weight: row.weight as number,
    skillMoves: row.skill_moves as number,
    weakFootAbility: row.weak_foot as number,
    preferredFoot: row.preferred_foot as string,
    gender: row.gender as string,
    nationalityId: row.nationality_id as string,
    nationalityLabel: row.nationality_label as string,
    nationalityImage: row.nationality_image as string,
    teamId: row.team_id as string,
    teamLabel: row.team_label as string,
    teamImage: row.team_image as string,
    leagueName: row.league_name as string,
    positionId: row.position_id as string,
    positionLabel: row.position_label as string,
    positionShort: row.position_short as string,
    positionType: row.position_type as string,
    alternatePositions: JSON.parse((row.alternate_positions as string) || '[]'),
    playerAbilities: JSON.parse((row.player_abilities as string) || '[]'),
    stats: JSON.parse((row.stats as string) || '{}'),
    avatarUrl: row.avatar_url as string,
    shieldUrl: row.shield_url as string,
  }
}

function ratingColor(r: number) {
  if (r >= 90) return 'text-amber-400'
  if (r >= 80) return 'text-slate-300'
  if (r >= 70) return 'text-amber-600'
  return 'text-slate-400'
}

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'text-amber-400' : 'text-slate-700'}>★</span>
      ))}
    </span>
  )
}

function age(birthdate: string) {
  if (!birthdate) return '—'
  const b = new Date(birthdate)
  const now = new Date()
  const y = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  return y - (m < 0 || (m === 0 && now.getDate() < b.getDate()) ? 1 : 0)
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM players WHERE id = ?', args: [id] })
  if (!result.rows[0]) notFound()

  const player = rowToPlayer(result.rows[0])
  const displayName = player.commonName || `${player.firstName} ${player.lastName}`.trim()
  const isGK = player.positionShort === 'GK'


  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        ← Back to players
      </Link>

      {/* Hero */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-6">
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 flex gap-6 items-end">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {player.avatarUrl ? (
              <Image
                src={player.avatarUrl}
                alt={displayName}
                width={180}
                height={180}
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="w-44 h-44 bg-slate-700 rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-2">
            {/* Rating + position */}
            <div className="flex items-center gap-4 mb-2">
              <span className={`text-6xl font-black ${ratingColor(player.overallRating)}`}>
                {player.overallRating}
              </span>
              <div>
                <div className="text-2xl font-bold text-slate-300">{player.positionShort}</div>
                <div className="text-sm text-slate-500">{player.positionLabel}</div>
              </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-3">{displayName}</h1>

            <div className="flex flex-wrap items-center gap-4">
              {/* Nationality */}
              <div className="flex items-center gap-2">
                {player.nationalityImage && (
                  <Image src={player.nationalityImage} alt={player.nationalityLabel} width={24} height={18} className="rounded-sm" unoptimized />
                )}
                <span className="text-slate-300 font-medium">{player.nationalityLabel}</span>
              </div>

              {/* Club */}
              <div className="flex items-center gap-2">
                {player.teamImage && (
                  <Image src={player.teamImage} alt={player.teamLabel} width={28} height={28} className="object-contain" unoptimized />
                )}
                <div>
                  <div className="text-slate-300 font-medium">{player.teamLabel}</div>
                  <div className="text-xs text-slate-500">{player.leagueName}</div>
                </div>
              </div>
            </div>

            {/* Alternate positions */}
            {player.alternatePositions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {player.alternatePositions.map((ap) => (
                  <span key={ap.id} className="text-xs border border-slate-600 text-slate-400 px-2 py-0.5 rounded">
                    {ap.shortLabel}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Shield top-right */}
          {player.shieldUrl && (
            <div className="absolute top-6 right-6">
              <Image src={player.shieldUrl} alt={player.teamLabel} width={64} height={64} className="object-contain" unoptimized />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Stats</h2>
            <PlayerStats stats={player.stats} isGK={isGK} />
          </div>

          {/* PlayStyles */}
          {player.playerAbilities.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">PlayStyles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[...player.playerAbilities]
                  .sort((a, b) => {
                    const aPlus = a.type?.label === 'Play Style Plus' ? 0 : 1
                    const bPlus = b.type?.label === 'Play Style Plus' ? 0 : 1
                    return aPlus - bPlus
                  })
                  .map((a: PlayerAbility) => {
                    const isPlus = a.type?.label === 'Play Style Plus'
                    return (
                      <div key={a.id} className="relative group bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-3 cursor-default">
                        {a.imageUrl && (
                          <Image
                            src={a.imageUrl}
                            alt=""
                            width={48}
                            height={48}
                            className="object-contain flex-shrink-0"
                            style={{ mixBlendMode: 'screen' }}
                            unoptimized
                          />
                        )}
                        <p className={`font-bold text-sm leading-tight ${isPlus ? 'text-amber-400' : 'text-white'}`}>
                          {a.label}
                        </p>
                        {a.description && (
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {a.description}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Bio sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Bio</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Age
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    The player&apos;s current age based on their date of birth.
                  </div>
                </dt>
                <dd className="text-white font-medium">{age(player.birthdate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Height
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Player&apos;s height in centimeters. Taller players have an advantage in aerial duels.
                  </div>
                </dt>
                <dd className="text-white font-medium">{player.height} cm</dd>
              </div>
              <div className="flex justify-between">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Weight
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Player&apos;s weight in kilograms. Influences physical strength in challenges.
                  </div>
                </dt>
                <dd className="text-white font-medium">{player.weight} kg</dd>
              </div>
              <div className="flex justify-between">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Preferred foot
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    The player&apos;s dominant foot. Using the weaker foot reduces shooting, passing, and dribbling accuracy.
                  </div>
                </dt>
                <dd className="text-white font-medium">
                  {player.preferredFoot === '1.0' ? 'Right' : player.preferredFoot === '2.0' ? 'Left' : player.preferredFoot || '—'}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Skill moves
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Rated 1–5 stars. Higher stars unlock more complex skill moves the player can perform in-game.
                  </div>
                </dt>
                <dd><StarRow count={player.skillMoves} /></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Weak foot
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Rated 1–5 stars. Determines how accurately the player uses their non-preferred foot for shooting and passing.
                  </div>
                </dt>
                <dd><StarRow count={player.weakFootAbility} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="relative group cursor-help text-slate-500 underline decoration-dotted decoration-slate-600">
                  Gender
                  <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Indicates whether the player belongs to a men&apos;s or women&apos;s team.
                  </div>
                </dt>
                <dd className="text-white font-medium">{player.gender || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Filters shortcut */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-2">Find similar players</p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/?position=${player.positionId}`}
                className="hover:text-emerald-400 transition-colors"
              >
                → Same position ({player.positionShort})
              </Link>
              <Link
                href={`/?nationality=${encodeURIComponent(player.nationalityLabel)}`}
                className="hover:text-emerald-400 transition-colors"
              >
                → Same nation ({player.nationalityLabel})
              </Link>
              <Link
                href={`/?league=${encodeURIComponent(player.leagueName)}`}
                className="hover:text-emerald-400 transition-colors"
              >
                → Same league
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
