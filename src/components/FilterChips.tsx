'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterData {
  positions: { id: string; label: string; short: string; type: string }[]
  leagues: { name: string }[]
  nationalities: { label: string; imageUrl: string }[]
  abilities: { id: string; label: string; description: string; typeLabel: string; imageUrl: string }[]
}

interface FilterChipsProps {
  filterData: FilterData
}

interface Chip {
  key: string
  value?: string
  label: string
  imageUrl?: string
}

export function FilterChips({ filterData }: FilterChipsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const positionStr = searchParams.get('position') ?? ''
  const nationalityStr = searchParams.get('nationality') ?? ''
  const leagueStr = searchParams.get('league') ?? ''
  const playstyleStr = searchParams.get('playstyleId') ?? ''
  const gender = searchParams.get('gender') ?? ''
  const ratingMin = searchParams.get('ratingMin') ?? '0'
  const ratingMax = searchParams.get('ratingMax') ?? '99'
  const view = searchParams.get('view') ?? ''

  const positionIds = positionStr.split(',').filter(Boolean)
  const nationalityLabels = nationalityStr.split(',').filter(Boolean)
  const leagueNames = leagueStr.split(',').filter(Boolean)
  const playstyleIds = playstyleStr.split(',').filter(Boolean)

  function removeParam(key: string, value?: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value !== undefined) {
      const current = p.get(key)?.split(',').filter(Boolean) ?? []
      const next = current.filter((v) => v !== value)
      if (next.length) p.set(key, next.join(','))
      else p.delete(key)
    } else {
      p.delete(key)
    }
    p.delete('page')
    const qs = p.toString()
    router.push(qs ? `/?${qs}` : '/')
  }

  function clearAll() {
    const p = new URLSearchParams()
    if (view) p.set('view', view)
    const qs = p.toString()
    router.push(qs ? `/?${qs}` : '/')
  }

  const chips: Chip[] = []

  if (q) chips.push({ key: 'q', label: `"${q}"` })
  if (gender) chips.push({ key: 'gender', label: gender === "Men's Football" ? "Men's" : "Women's" })
  if (ratingMin && ratingMin !== '0') chips.push({ key: 'ratingMin', label: `OVR ≥ ${ratingMin}` })
  if (ratingMax && ratingMax !== '99') chips.push({ key: 'ratingMax', label: `OVR ≤ ${ratingMax}` })

  positionIds.forEach((id) => {
    const pos = filterData.positions.find((p) => p.id === id)
    chips.push({ key: 'position', value: id, label: pos ? `${pos.short} — ${pos.label}` : id })
  })

  nationalityLabels.forEach((label) => {
    const nat = filterData.nationalities.find((n) => n.label === label)
    chips.push({ key: 'nationality', value: label, label, imageUrl: nat?.imageUrl })
  })

  leagueNames.forEach((name) => {
    chips.push({ key: 'league', value: name, label: name })
  })

  playstyleIds.forEach((id) => {
    const ps = filterData.abilities.find((a) => a.id === id)
    chips.push({ key: 'playstyleId', value: id, label: ps ? ps.label : id })
  })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {chips.map((chip, i) => (
        <span
          key={`${chip.key}-${chip.value ?? i}`}
          className="inline-flex items-center gap-1.5 bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-full"
        >
          {chip.imageUrl && (
            <Image
              src={chip.imageUrl}
              alt={chip.label}
              width={14}
              height={10}
              className="object-contain rounded-sm"
              unoptimized
            />
          )}
          <span>{chip.label}</span>
          <button
            onClick={() => removeParam(chip.key, chip.value)}
            className="text-slate-400 hover:text-white font-bold leading-none"
            aria-label={`Remove ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      {chips.length >= 2 && (
        <button
          onClick={clearAll}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
