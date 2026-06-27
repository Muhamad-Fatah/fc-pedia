'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface FilterData {
  positions: { id: string; label: string; short: string; type: string }[]
  leagues: { name: string }[]
  nationalities: { label: string; imageUrl: string }[]
  abilities: { id: string; label: string; description: string; typeLabel: string }[]
}

interface Props {
  filterData: FilterData
}

export function PlayerFilters({ filterData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [position, setPosition] = useState(searchParams.get('position') ?? '')
  const [nationality, setNationality] = useState(searchParams.get('nationality') ?? '')
  const [league, setLeague] = useState(searchParams.get('league') ?? '')
  const [ratingMin, setRatingMin] = useState(searchParams.get('ratingMin') ?? '0')
  const [ratingMax, setRatingMax] = useState(searchParams.get('ratingMax') ?? '99')
  const [playstyleId, setPlaystyleId] = useState(searchParams.get('playstyleId') ?? '')
  const [gender, setGender] = useState(searchParams.get('gender') ?? '')

  const buildUrl = useCallback((overrides: Record<string, string> = {}) => {
    const state = { q, position, nationality, league, ratingMin, ratingMax, playstyleId, gender, ...overrides }
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    if (state.position) p.set('position', state.position)
    if (state.nationality) p.set('nationality', state.nationality)
    if (state.league) p.set('league', state.league)
    if (state.ratingMin && state.ratingMin !== '0') p.set('ratingMin', state.ratingMin)
    if (state.ratingMax && state.ratingMax !== '99') p.set('ratingMax', state.ratingMax)
    if (state.playstyleId) p.set('playstyleId', state.playstyleId)
    if (state.gender) p.set('gender', state.gender)
    const qs = p.toString()
    return qs ? `/?${qs}` : '/'
  }, [q, position, nationality, league, ratingMin, ratingMax, playstyleId, gender])

  // Debounce only search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q }))
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function applyDropdown(overrides: Record<string, string>) {
    router.push(buildUrl(overrides))
  }

  function reset() {
    setQ(''); setPosition(''); setNationality(''); setLeague('')
    setRatingMin('0'); setRatingMax('99'); setPlaystyleId(''); setGender('')
    router.push('/')
  }

  const selectCls = 'w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'
  const inputCls = 'w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500'

  const posTypes = [...new Set(filterData.positions.map((p) => p.type))]

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
              onClick={() => { setGender(value); applyDropdown({ gender: value }) }}
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
            onBlur={() => applyDropdown({ ratingMin })}
            className={`${inputCls} w-20`}
            placeholder="Min"
          />
          <span className="text-slate-500">–</span>
          <input
            type="number" min="0" max="99" value={ratingMax}
            onChange={(e) => setRatingMax(e.target.value)}
            onBlur={() => applyDropdown({ ratingMax })}
            className={`${inputCls} w-20`}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Position</label>
        <select
          value={position}
          onChange={(e) => { setPosition(e.target.value); applyDropdown({ position: e.target.value }) }}
          className={selectCls}
        >
          <option value="">All positions</option>
          {posTypes.map((type) => (
            <optgroup key={type} label={type}>
              {filterData.positions.filter((p) => p.type === type).map((p) => (
                <option key={p.id} value={p.id}>{p.short} — {p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Nationality */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nationality</label>
        <select
          value={nationality}
          onChange={(e) => { setNationality(e.target.value); applyDropdown({ nationality: e.target.value }) }}
          className={selectCls}
        >
          <option value="">All nations</option>
          {filterData.nationalities.map((n) => (
            <option key={n.label} value={n.label}>{n.label}</option>
          ))}
        </select>
      </div>

      {/* League */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">League</label>
        <select
          value={league}
          onChange={(e) => { setLeague(e.target.value); applyDropdown({ league: e.target.value }) }}
          className={selectCls}
        >
          <option value="">All leagues</option>
          {filterData.leagues.map((l) => (
            <option key={l.name} value={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* PlayStyle */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">PlayStyle</label>
        <select
          value={playstyleId}
          onChange={(e) => { setPlaystyleId(e.target.value); applyDropdown({ playstyleId: e.target.value }) }}
          className={selectCls}
        >
          <option value="">Any playstyle</option>
          {filterData.abilities.map((a) => (
            <option key={a.id} value={a.id}>{a.typeLabel === 'Play Style Plus' ? '★ ' : ''}{a.label}</option>
          ))}
        </select>
      </div>

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
