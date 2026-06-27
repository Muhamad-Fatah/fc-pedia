import Link from 'next/link'
import Image from 'next/image'
import type { Player } from '@/lib/types'

function ratingColor(r: number) {
  if (r >= 90) return 'text-amber-400'
  if (r >= 80) return 'text-slate-300'
  if (r >= 70) return 'text-amber-600'
  return 'text-slate-400'
}

function positionColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'attacker': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'midfielder': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'defender': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'goalkeeper': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

interface Props {
  player: Player
}

export function PlayerCard({ player }: Props) {
  const displayName = player.commonName || `${player.firstName} ${player.lastName}`.trim()

  return (
    <Link href={`/player/${player.id}`} className="group block">
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 hover:bg-slate-750 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5">
        {/* Player image area */}
        <div className="relative bg-gradient-to-b from-slate-700 to-slate-800 h-40 flex items-end justify-center">
          {/* Rating badge */}
          <div className="absolute top-3 left-3 text-center">
            <div className={`text-2xl font-black ${ratingColor(player.overallRating)}`}>
              {player.overallRating}
            </div>
            <div className={`text-xs font-bold border rounded px-1 mt-0.5 ${positionColor(player.positionType)}`}>
              {player.positionShort}
            </div>
          </div>

          {/* Club shield */}
          {player.teamImage && (
            <div className="absolute top-3 right-3">
              <Image
                src={player.teamImage}
                alt={player.teamLabel}
                width={32}
                height={32}
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {/* Player avatar */}
          {player.avatarUrl ? (
            <Image
              src={player.avatarUrl}
              alt={displayName}
              width={120}
              height={120}
              className="object-contain object-bottom h-36 w-auto"
              unoptimized
            />
          ) : (
            <div className="h-36 w-24 flex items-end justify-center">
              <div className="w-16 h-24 bg-slate-600 rounded-t-full" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-emerald-400 transition-colors">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {player.nationalityImage && (
              <Image
                src={player.nationalityImage}
                alt={player.nationalityLabel}
                width={16}
                height={12}
                className="object-contain rounded-sm"
                unoptimized
              />
            )}
            <span className="text-xs text-slate-400 truncate">{player.teamLabel}</span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">{player.leagueName}</div>
        </div>
      </div>
    </Link>
  )
}
