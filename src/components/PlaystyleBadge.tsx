'use client'

import type { PlayerAbility } from '@/lib/types'

interface Props {
  ability: PlayerAbility
  size?: 'sm' | 'md'
}

export function PlaystyleBadge({ ability, size = 'md' }: Props) {
  const isPlus = ability.type?.label === 'Play Style Plus'
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <span
      title={ability.description}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${
        isPlus
          ? 'bg-amber-400 text-black'
          : 'border border-slate-500 text-slate-300 bg-slate-800'
      }`}
    >
      {ability.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ability.imageUrl}
          alt=""
          width={iconSize}
          height={iconSize}
          className="object-contain flex-shrink-0"
          style={{ filter: isPlus ? 'invert(1)' : undefined }}
        />
      )}
      {isPlus && <span className="text-xs font-bold">+</span>}
      {ability.label}
    </span>
  )
}
