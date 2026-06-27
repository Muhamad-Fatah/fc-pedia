'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FilterCombobox } from './FilterCombobox'
import { categorizePlaystyle, PLAYSTYLE_CATEGORY_ORDER } from '@/lib/playstyle-categories'

export interface FilterData {
  positions: { id: string; label: string; short: string; type: string }[]
  leagues: { name: string }[]
  nationalities: { label: string; imageUrl: string }[]
  abilities: { id: string; label: string; description: string; typeLabel: string; imageUrl: string }[]
}

interface Props {
  filterData: FilterData
  view?: string
}

interface BuildUrlOverrides {
  positions?: string[]
  nationalities?: string[]
  leagues?: string[]
  playstyleIds?: string[]
  q?: string
  gender?: string
  ratingMin?: string
  ratingMax?: string
}

export function PlayerFilters({ filterData, view }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [positions, setPositions] = useState<string[]>(
    searchParams.get('position')?.split(',').filter(Boolean) ?? []
  )
  const [nationalities, setNationalities] = useState<string[]>(
    searchParams.get('nationality')?.split(',').filter(Boolean) ?? []
  )
  const [leagues, setLeagues] = useState<string[]>(
    searchParams.get('league')?.split(',').filter(Boolean) ?? []
  )
  const [ratingMin, setRatingMin] = useState(searchParams.get('ratingMin') ?? '0')
  const [ratingMax, setRatingMax] = useState(searchParams.get('ratingMax') ?? '99')
  const [playstyleIds, setPlaystyleIds] = useState<string[]>(
    searchParams.get('playstyleId')?.split(',').filter(Boolean) ?? []
  )
  const [gender, setGender] = useState(searchParams.get('gender') ?? '')

  const buildUrl = useCallback(
    (overrides: BuildUrlOverrides = {}) => {
      const pos = overrides.positions ?? positions
      const nats = overrides.nationalities ?? nationalities
      const lgs = overrides.leagues ?? leagues
      const ps = overrides.playstyleIds ?? playstyleIds
      const _q = overrides.q ?? q
      const _gender = overrides.gender ?? gender
      const _ratingMin = overrides.ratingMin ?? ratingMin
      const _ratingMax = overrides.ratingMax ?? ratingMax

      const p = new URLSearchParams()
      if (_q) p.set('q', _q)
      if (pos.length) p.set('position', pos.join(','))
      if (nats.length) p.set('nationality', nats.join(','))
      if (lgs.length) p.set('league', lgs.join(','))
      if (_ratingMin && _ratingMin !== '0') p.set('ratingMin', _ratingMin)
      if (_ratingMax && _ratingMax !== '99') p.set('ratingMax', _ratingMax)
      if (ps.length) p.set('playstyleId', ps.join(','))
      if (_gender) p.set('gender', _gender)
      if (view === 'table') p.set('view', 'table')
      const qs = p.toString()
      return qs ? `/?${qs}` : '/'
    },
    [positions, nationalities, leagues, playstyleIds, q, gender, ratingMin, ratingMax, view]
  )

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q }))
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function reset() {
    setQ(''); setPositions([]); setNationalities([]); setLeagues([])
    setRatingMin('0'); setRatingMax('99'); setPlaystyleIds([]); setGender('')
    const p = new URLSearchParams()
    if (view === 'table') p.set('view', 'table')
    const qs = p.toString()
    router.push(qs ? `/?${qs}` : '/')
  }

  const inputCls = 'w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500'

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Player name</label>
        <input
          type="text"
          placeholder="Search player..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Gender toggle */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: "Men's Football", label: "Men's" },
            { value: "Women's Football", label: "Women's" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setGender(value); router.push(buildUrl({ gender: value })) }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                gender === value
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating range */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Rating: {ratingMin} – {ratingMax}
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number" min="0" max="99" value={ratingMin}
            onChange={(e) => setRatingMin(e.target.value)}
            onBlur={() => router.push(buildUrl({ ratingMin }))}
            className={`${inputCls} w-20`}
            placeholder="Min"
          />
          <span className="text-slate-500">–</span>
          <input
            type="number" min="0" max="99" value={ratingMax}
            onChange={(e) => setRatingMax(e.target.value)}
            onBlur={() => router.push(buildUrl({ ratingMax }))}
            className={`${inputCls} w-20`}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Position */}
      <FilterCombobox
        label="Position"
        options={filterData.positions.map((p) => ({
          value: p.id,
          label: `${p.short} — ${p.label}`,
          group: p.type,
        }))}
        selected={positions}
        onChange={(vals) => { setPositions(vals); router.push(buildUrl({ positions: vals })) }}
      />

      {/* Nationality */}
      <FilterCombobox
        label="Nationality"
        options={filterData.nationalities.map((n) => ({
          value: n.label,
          label: n.label,
          imageUrl: n.imageUrl,
        }))}
        selected={nationalities}
        onChange={(vals) => { setNationalities(vals); router.push(buildUrl({ nationalities: vals })) }}
      />

      {/* League */}
      <FilterCombobox
        label="League"
        options={filterData.leagues.map((l) => ({
          value: l.name,
          label: l.name,
        }))}
        selected={leagues}
        onChange={(vals) => { setLeagues(vals); router.push(buildUrl({ leagues: vals })) }}
      />

      {/* PlayStyle */}
      <FilterCombobox
        label="PlayStyle"
        options={filterData.abilities.map((a) => ({
          value: a.id,
          label: a.label,
          imageUrl: a.imageUrl,
          group: a.typeLabel === 'Play Style Plus' ? 'PlayStyle+' : 'PlayStyle',
          category: categorizePlaystyle(a.label),
        }))}
        tabs={['PlayStyle+', 'PlayStyle']}
        categoryOrder={PLAYSTYLE_CATEGORY_ORDER}
        selected={playstyleIds}
        onChange={(vals) => { setPlaystyleIds(vals); router.push(buildUrl({ playstyleIds: vals })) }}
      />

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full py-2 text-sm font-medium text-slate-400 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-200 transition-colors"
      >
        Reset all filters
      </button>
    </div>
  )
}
