'use client'

import { useState } from 'react'
import type { PlayerStats as Stats } from '@/lib/types'

interface StatBarProps {
  label: string
  value: number
  max?: number
}

function StatBar({ label, value, max = 99 }: StatBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const color =
    value >= 85 ? 'bg-emerald-400' :
    value >= 70 ? 'bg-lime-400' :
    value >= 55 ? 'bg-amber-400' :
    value >= 40 ? 'bg-orange-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right font-bold text-white tabular-nums">{value}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-xs text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  )
}

const MAIN_STATS = [
  { key: 'pac', label: 'PAC', subs: ['acceleration', 'sprintSpeed'] },
  { key: 'sho', label: 'SHO', subs: ['finishing', 'shotPower', 'longShots', 'volleys', 'penalties', 'positioning'] },
  { key: 'pas', label: 'PAS', subs: ['crossing', 'curve', 'freeKickAccuracy', 'longPassing', 'shortPassing', 'vision'] },
  { key: 'dri', label: 'DRI', subs: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'] },
  { key: 'def', label: 'DEF', subs: ['interceptions', 'defensiveAwareness', 'standingTackle', 'slidingTackle'] },
  { key: 'phy', label: 'PHY', subs: ['jumping', 'stamina', 'strength', 'aggression', 'headingAccuracy'] },
] as const

const SUB_LABELS: Record<string, string> = {
  acceleration: 'Acceleration', sprintSpeed: 'Sprint Speed',
  finishing: 'Finishing', shotPower: 'Shot Power', longShots: 'Long Shots',
  volleys: 'Volleys', penalties: 'Penalties', positioning: 'Positioning',
  crossing: 'Crossing', curve: 'Curve', freeKickAccuracy: 'FK Accuracy',
  longPassing: 'Long Pass', shortPassing: 'Short Pass', vision: 'Vision',
  agility: 'Agility', balance: 'Balance', reactions: 'Reactions',
  ballControl: 'Ball Control', dribbling: 'Dribbling', composure: 'Composure',
  interceptions: 'Interceptions', defensiveAwareness: 'Def. Awareness',
  standingTackle: 'Stand. Tackle', slidingTackle: 'Slide Tackle',
  jumping: 'Jumping', stamina: 'Stamina', strength: 'Strength',
  aggression: 'Aggression', headingAccuracy: 'Heading',
}

interface Props {
  stats: Stats
  isGK?: boolean
}

export function PlayerStats({ stats, isGK }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isGK) {
    return (
      <div className="space-y-2">
        {[
          { key: 'gkDiving', label: 'DIV' }, { key: 'gkHandling', label: 'HAN' },
          { key: 'gkKicking', label: 'KIC' }, { key: 'gkPositioning', label: 'POS' },
          { key: 'gkReflexes', label: 'REF' },
        ].map(({ key, label }) => (
          <StatBar key={key} label={label} value={(stats[key as keyof Stats] as { value: number })?.value ?? 0} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {MAIN_STATS.map(({ key, label, subs }) => {
        const val = (stats[key as keyof Stats] as { value: number })?.value ?? 0
        const isOpen = expanded === key
        return (
          <div key={key}>
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="w-full group"
            >
              <div className="flex items-center gap-3 py-1">
                <span className="w-8 text-right font-bold text-white tabular-nums">{val}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      val >= 85 ? 'bg-emerald-400' : val >= 70 ? 'bg-lime-400' :
                      val >= 55 ? 'bg-amber-400' : val >= 40 ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((val / 99) * 100, 100)}%` }}
                  />
                </div>
                <span className="w-24 text-xs text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  {label}
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </span>
              </div>
            </button>
            {isOpen && (
              <div className="ml-11 mt-1 mb-2 space-y-1.5 border-l-2 border-slate-700 pl-4">
                {subs.map((sub) => (
                  <StatBar
                    key={sub}
                    label={SUB_LABELS[sub] ?? sub}
                    value={(stats[sub as keyof Stats] as { value: number })?.value ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
