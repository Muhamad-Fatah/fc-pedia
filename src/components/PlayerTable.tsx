'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Player } from '@/lib/types'

function ratingColor(r: number) {
  if (r >= 90) return 'text-amber-400'
  if (r >= 80) return 'text-slate-300'
  if (r >= 70) return 'text-amber-600'
  return 'text-slate-400'
}

function positionColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'attacker': return 'bg-red-500/20 text-red-400'
    case 'midfielder': return 'bg-emerald-500/20 text-emerald-400'
    case 'defender': return 'bg-blue-500/20 text-blue-400'
    case 'goalkeeper': return 'bg-amber-500/20 text-amber-400'
    default: return 'bg-slate-500/20 text-slate-400'
  }
}

function statColor(v: number) {
  if (v >= 80) return 'text-emerald-400'
  if (v >= 70) return 'text-amber-400'
  return 'text-slate-400'
}

interface Props {
  players: Player[]
}

export function PlayerTable({ players }: Props) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pl-3 pr-4 w-12">#</th>
            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Player</th>
            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Nat</th>
            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Team</th>
            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Pos</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">OVR</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">PAC</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">SHO</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">PAS</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">DRI</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">DEF</th>
            <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4 w-12">PHY</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const displayName = player.commonName || `${player.firstName} ${player.lastName}`.trim()
            const s = player.stats

            return (
              <tr
                key={player.id}
                onClick={() => router.push(`/player/${player.id}`)}
                className="cursor-pointer group even:bg-slate-800/20 hover:bg-slate-800/60 transition-colors"
              >
                <td className="py-2.5 pl-3 pr-4 text-slate-500 tabular-nums">{player.rank}</td>

                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="object-contain object-bottom rounded-full bg-slate-700 shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                    )}
                    <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate max-w-[160px]">
                      {displayName}
                    </span>
                  </div>
                </td>

                <td className="py-2.5 pr-4">
                  {player.nationalityImage ? (
                    <Image
                      src={player.nationalityImage}
                      alt={player.nationalityLabel}
                      title={player.nationalityLabel}
                      width={20}
                      height={14}
                      className="object-contain rounded-sm"
                      unoptimized
                    />
                  ) : (
                    <span className="text-slate-500 text-xs">{player.nationalityLabel}</span>
                  )}
                </td>

                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    {player.teamImage && (
                      <Image
                        src={player.teamImage}
                        alt={player.teamLabel}
                        width={18}
                        height={18}
                        className="object-contain shrink-0"
                        unoptimized
                      />
                    )}
                    <span className="text-slate-300 truncate max-w-[120px]">{player.teamLabel}</span>
                  </div>
                </td>

                <td className="py-2.5 pr-4">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${positionColor(player.positionType)}`}>
                    {player.positionShort}
                  </span>
                </td>

                <td className={`py-2.5 pr-4 text-right font-bold tabular-nums ${ratingColor(player.overallRating)}`}>
                  {player.overallRating}
                </td>

                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.pac?.value ?? 0)}`}>
                  {s?.pac?.value ?? '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.sho?.value ?? 0)}`}>
                  {s?.sho?.value ?? '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.pas?.value ?? 0)}`}>
                  {s?.pas?.value ?? '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.dri?.value ?? 0)}`}>
                  {s?.dri?.value ?? '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.def?.value ?? 0)}`}>
                  {s?.def?.value ?? '—'}
                </td>
                <td className={`py-2.5 pr-4 text-right tabular-nums ${statColor(s?.phy?.value ?? 0)}`}>
                  {s?.phy?.value ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
