'use client'

import type { PlayerAbility } from '@/lib/types'

interface Props {
  ability: PlayerAbility
  size?: 'sm' | 'md'
}

export function PlaystyleBadge({ ability, size = 'md' }: Props) {
  const isPlus = ability.type?.label === 'Play Style Plus'
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span
      title={ability.description}
      className={`inline-flex items-center gap-1 rounded-full font-medium ${px} ${
        isPlus
          ? 'bg-amber-400 text-black'
          : 'border border-slate-500 text-slate-300 bg-slate-800'
      }`}
    >
      {isPlus && <span className="text-xs font-bold">+</span>}
      {ability.label}
    </span>
  )
}
