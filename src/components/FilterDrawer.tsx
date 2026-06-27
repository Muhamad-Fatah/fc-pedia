'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { categorizePlaystyle, PLAYSTYLE_CATEGORY_ORDER } from '@/lib/playstyle-categories'

export interface FilterData {
  positions: { id: string; label: string; short: string; type: string }[]
  leagues: { name: string }[]
  teams: { id: string; label: string; image: string; leagueName: string }[]
  nationalities: { label: string; imageUrl: string }[]
  abilities: { id: string; label: string; description: string; typeLabel: string; imageUrl: string }[]
}

interface FilterDrawerProps {
  filterData: FilterData
  view: string
}

type Page = 'main' | 'leagues' | 'position' | 'nation' | 'playstyles'

const SORT_OPTIONS = [
  { value: 'rank', label: 'Rank' },
  { value: 'overall', label: 'Overall' },
  { value: 'pace', label: 'Pace' },
  { value: 'shooting', label: 'Shooting' },
  { value: 'passing', label: 'Passing' },
  { value: 'dribbling', label: 'Dribbling' },
  { value: 'defending', label: 'Defending' },
  { value: 'physicality', label: 'Physicality' },
]

// Preferred display order for position groups
const POSITION_GROUP_ORDER = ['Attackers', 'Midfielders', 'Defenders', 'Goalkeepers']

function positionBadgeColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'attacker': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'midfielder': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'defender': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    case 'goalkeeper': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 10" width="10" height="8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1,5 4,8 11,1" />
        </svg>
      )}
    </div>
  )
}

function ActiveFilterCount() {
  const sp = useSearchParams()
  const count = [
    sp.get('q'),
    sp.get('position'),
    sp.get('nationality'),
    sp.get('league'),
    sp.get('teamId'),
    sp.get('playstyleId'),
    sp.get('gender'),
    sp.get('sort') && sp.get('sort') !== 'rank' ? '1' : null,
    sp.get('ratingMin') && sp.get('ratingMin') !== '0' ? '1' : null,
    sp.get('ratingMax') && sp.get('ratingMax') !== '99' ? '1' : null,
  ].filter(Boolean).length

  if (count === 0) return null
  return (
    <span className="ml-1.5 bg-emerald-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
      {count}
    </span>
  )
}

interface BuildUrlOverrides {
  positions?: string[]
  nationalities?: string[]
  leagues?: string[]
  teamIds?: string[]
  playstyleIds?: string[]
  gender?: string
  sort?: string
}

function FilterPanelContent({
  filterData,
  view,
  onClose,
}: {
  filterData: FilterData
  view: string
  onClose: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activePage, setActivePage] = useState<Page>('main')
  const [subSearch, setSubSearch] = useState('')
  const [playstyleTab, setPlaystyleTab] = useState<'PlayStyle+' | 'PlayStyle'>('PlayStyle+')

  const [positions, setPositions] = useState<string[]>(
    searchParams.get('position')?.split(',').filter(Boolean) ?? []
  )
  const [nationalities, setNationalities] = useState<string[]>(
    searchParams.get('nationality')?.split(',').filter(Boolean) ?? []
  )
  const [leagues, setLeagues] = useState<string[]>(
    searchParams.get('league')?.split(',').filter(Boolean) ?? []
  )
  const [teamIds, setTeamIds] = useState<string[]>(
    searchParams.get('teamId')?.split(',').filter(Boolean) ?? []
  )
  const [playstyleIds, setPlaystyleIds] = useState<string[]>(
    searchParams.get('playstyleId')?.split(',').filter(Boolean) ?? []
  )
  const [gender, setGender] = useState(searchParams.get('gender') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'rank')

  const buildUrl = useCallback(
    (overrides: BuildUrlOverrides = {}) => {
      const pos = overrides.positions ?? positions
      const nats = overrides.nationalities ?? nationalities
      const lgs = overrides.leagues ?? leagues
      const tms = overrides.teamIds ?? teamIds
      const ps = overrides.playstyleIds ?? playstyleIds
      const _gender = overrides.gender ?? gender
      const _sort = overrides.sort ?? sort
      const q = searchParams.get('q') ?? ''
      const ratingMin = searchParams.get('ratingMin') ?? '0'
      const ratingMax = searchParams.get('ratingMax') ?? '99'

      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (pos.length) p.set('position', pos.join(','))
      if (nats.length) p.set('nationality', nats.join(','))
      if (lgs.length) p.set('league', lgs.join(','))
      if (tms.length) p.set('teamId', tms.join(','))
      if (ratingMin && ratingMin !== '0') p.set('ratingMin', ratingMin)
      if (ratingMax && ratingMax !== '99') p.set('ratingMax', ratingMax)
      if (ps.length) p.set('playstyleId', ps.join(','))
      if (_gender) p.set('gender', _gender)
      if (_sort && _sort !== 'rank') p.set('sort', _sort)
      if (view === 'table') p.set('view', 'table')
      const qs = p.toString()
      return qs ? `/?${qs}` : '/'
    },
    [positions, nationalities, leagues, teamIds, playstyleIds, gender, sort, view, searchParams]
  )

  function goBack() {
    setActivePage('main')
    setSubSearch('')
  }

  const inputCls =
    'w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500'

  function Header({ backable = false }: { backable?: boolean }) {
    return (
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          {backable && (
            <button
              onClick={goBack}
              className="text-slate-400 hover:text-white transition-colors p-1 -ml-1 rounded hover:bg-slate-700"
              aria-label="Back"
            >
              <BackIcon />
            </button>
          )}
          <h2 className="text-sm font-semibold text-white">Filter &amp; Sort</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          aria-label="Close filters"
        >
          <XIcon />
        </button>
      </div>
    )
  }

  function SelectionBar({ count, label, onReset }: { count: number; label: string; onReset: () => void }) {
    if (count === 0) return null
    return (
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-slate-300">{count} {label}</span>
        <button onClick={onReset} className="text-emerald-400 hover:text-emerald-300 underline text-xs">
          Reset
        </button>
      </div>
    )
  }

  const rowCls = 'flex items-center gap-3 px-5 py-3 hover:bg-slate-800/60 cursor-pointer border-b border-slate-700/40'

  // ── Leagues & Teams sub-panel ─────────────────────────────────────────────
  if (activePage === 'leagues') {
    const allTeams = filterData.teams
    const filteredTeams = allTeams.filter((t) =>
      t.label.toLowerCase().includes(subSearch.toLowerCase()) ||
      t.leagueName.toLowerCase().includes(subSearch.toLowerCase())
    )

    // Group by league
    const teamsByLeague = filteredTeams.reduce<Record<string, typeof allTeams>>((acc, t) => {
      if (!acc[t.leagueName]) acc[t.leagueName] = []
      acc[t.leagueName].push(t)
      return acc
    }, {})
    const leagueGroups = Object.keys(teamsByLeague).sort()

    function toggleTeam(id: string) {
      const next = teamIds.includes(id) ? teamIds.filter((t) => t !== id) : [...teamIds, id]
      setTeamIds(next)
      router.push(buildUrl({ teamIds: next }))
    }

    function toggleLeagueAll(leagueTeams: typeof allTeams) {
      const ids = leagueTeams.map((t) => t.id)
      const allIn = ids.every((id) => teamIds.includes(id))
      const next = allIn
        ? teamIds.filter((id) => !ids.includes(id))
        : Array.from(new Set([...teamIds, ...ids]))
      setTeamIds(next)
      router.push(buildUrl({ teamIds: next }))
    }

    return (
      <div className="flex flex-col h-full">
        <Header backable />
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <SelectionBar
            count={teamIds.length}
            label="Selected"
            onReset={() => { setTeamIds([]); router.push(buildUrl({ teamIds: [] })) }}
          />
          <input type="text" placeholder="Search leagues or teams..." value={subSearch} onChange={(e) => setSubSearch(e.target.value)} className={inputCls} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {leagueGroups.map((leagueName) => {
            const leagueTeams = teamsByLeague[leagueName]
            const allInLeague = leagueTeams.every((t) => teamIds.includes(t.id))
            return (
              <div key={leagueName}>
                <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-700/50">
                  <div onClick={() => toggleLeagueAll(leagueTeams)} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={allInLeague} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{leagueName}</span>
                  </div>
                </div>
                {leagueTeams.map((team) => (
                  <div key={team.id} onClick={() => toggleTeam(team.id)} className={rowCls}>
                    <Checkbox checked={teamIds.includes(team.id)} />
                    {team.image ? (
                      <Image src={team.image} alt="" width={24} height={24} className="object-contain shrink-0" unoptimized />
                    ) : (
                      <span className="w-6 h-6 shrink-0" />
                    )}
                    <span className="text-sm text-slate-200">{team.label}</span>
                  </div>
                ))}
              </div>
            )
          })}
          {leagueGroups.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No teams found</p>}
        </div>
      </div>
    )
  }

  // ── Position sub-panel ───────────────────────────────────────────────────
  if (activePage === 'position') {
    const filtered = filterData.positions.filter(
      (p) =>
        p.label.toLowerCase().includes(subSearch.toLowerCase()) ||
        p.short.toLowerCase().includes(subSearch.toLowerCase())
    )
    const grouped = filtered.reduce<Record<string, typeof filterData.positions>>((acc, pos) => {
      const key = pos.type || 'Other'
      if (!acc[key]) acc[key] = []
      acc[key].push(pos)
      return acc
    }, {})
    // Show in preferred order first, then any remaining types from the actual data
    const existingTypes = Object.keys(grouped)
    const groupsToShow = [
      ...POSITION_GROUP_ORDER.filter((g) => existingTypes.includes(g)),
      ...existingTypes.filter((g) => !POSITION_GROUP_ORDER.includes(g)),
    ]

    function togglePosition(id: string) {
      const next = positions.includes(id) ? positions.filter((p) => p !== id) : [...positions, id]
      setPositions(next)
      router.push(buildUrl({ positions: next }))
    }

    function toggleGroupAll(groupItems: typeof filterData.positions) {
      const ids = groupItems.map((p) => p.id)
      const allInGroup = ids.every((id) => positions.includes(id))
      const next = allInGroup
        ? positions.filter((id) => !ids.includes(id))
        : Array.from(new Set([...positions, ...ids]))
      setPositions(next)
      router.push(buildUrl({ positions: next }))
    }

    return (
      <div className="flex flex-col h-full">
        <Header backable />
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <SelectionBar
            count={positions.length}
            label="Selected"
            onReset={() => { setPositions([]); router.push(buildUrl({ positions: [] })) }}
          />
          <input type="text" placeholder="Search positions..." value={subSearch} onChange={(e) => setSubSearch(e.target.value)} className={inputCls} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {groupsToShow.map((group) => (
            <div key={group}>
              <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-700/50">
                <div onClick={() => toggleGroupAll(grouped[group])} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={grouped[group].every((p) => positions.includes(p.id))} />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</span>
                </div>
              </div>
              {grouped[group].map((pos) => (
                <div key={pos.id} onClick={() => togglePosition(pos.id)} className={rowCls}>
                  <Checkbox checked={positions.includes(pos.id)} />
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${positionBadgeColor(pos.type)}`}>{pos.short}</span>
                  <span className="text-sm text-slate-200">{pos.label}</span>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No positions found</p>}
        </div>
      </div>
    )
  }

  // ── Nation sub-panel ─────────────────────────────────────────────────────
  if (activePage === 'nation') {
    const filtered = filterData.nationalities.filter((n) =>
      n.label.toLowerCase().includes(subSearch.toLowerCase())
    )
    const filteredLabels = filtered.map((n) => n.label)
    const allSelected = filtered.length > 0 && filteredLabels.every((l) => nationalities.includes(l))

    function toggleNation(label: string) {
      const next = nationalities.includes(label)
        ? nationalities.filter((n) => n !== label)
        : [...nationalities, label]
      setNationalities(next)
      router.push(buildUrl({ nationalities: next }))
    }

    function toggleSelectAll() {
      const next = allSelected
        ? nationalities.filter((n) => !filteredLabels.includes(n))
        : Array.from(new Set([...nationalities, ...filteredLabels]))
      setNationalities(next)
      router.push(buildUrl({ nationalities: next }))
    }

    return (
      <div className="flex flex-col h-full">
        <Header backable />
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <SelectionBar
            count={nationalities.length}
            label="Selected"
            onReset={() => { setNationalities([]); router.push(buildUrl({ nationalities: [] })) }}
          />
          <input type="text" placeholder="Search nations..." value={subSearch} onChange={(e) => setSubSearch(e.target.value)} className={inputCls} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div onClick={toggleSelectAll} className={`${rowCls} border-slate-700`}>
            <Checkbox checked={allSelected} />
            <span className="text-sm text-slate-300">Select All</span>
          </div>
          {filtered.map((nat) => (
            <div key={nat.label} onClick={() => toggleNation(nat.label)} className={rowCls}>
              <Checkbox checked={nationalities.includes(nat.label)} />
              {nat.imageUrl && (
                <Image src={nat.imageUrl} alt="" width={20} height={14} className="object-cover rounded-sm shrink-0" unoptimized />
              )}
              <span className="text-sm text-slate-200">{nat.label}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No nations found</p>}
        </div>
      </div>
    )
  }

  // ── PlayStyles sub-panel ─────────────────────────────────────────────────
  if (activePage === 'playstyles') {
    const tabAbilities = filterData.abilities.filter((a) =>
      playstyleTab === 'PlayStyle+'
        ? a.typeLabel === 'Play Style Plus'
        : a.typeLabel !== 'Play Style Plus'
    )
    const grouped: Record<string, typeof filterData.abilities> = {}
    for (const ability of tabAbilities) {
      const cat = categorizePlaystyle(ability.label)
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(ability)
    }

    function toggleAbility(id: string) {
      const next = playstyleIds.includes(id)
        ? playstyleIds.filter((p) => p !== id)
        : [...playstyleIds, id]
      setPlaystyleIds(next)
      router.push(buildUrl({ playstyleIds: next }))
    }

    function toggleCategoryAll(catItems: typeof filterData.abilities) {
      const ids = catItems.map((a) => a.id)
      const allInCat = ids.every((id) => playstyleIds.includes(id))
      const next = allInCat
        ? playstyleIds.filter((id) => !ids.includes(id))
        : Array.from(new Set([...playstyleIds, ...ids]))
      setPlaystyleIds(next)
      router.push(buildUrl({ playstyleIds: next }))
    }

    return (
      <div className="flex flex-col h-full">
        <Header backable />
        <div className="px-5 pt-3 pb-3 flex-shrink-0 border-b border-slate-700">
          <SelectionBar
            count={playstyleIds.length}
            label="Selections Applied"
            onReset={() => { setPlaystyleIds([]); router.push(buildUrl({ playstyleIds: [] })) }}
          />
          <div className="flex gap-2">
            {(['PlayStyle+', 'PlayStyle'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPlaystyleTab(tab)}
                className={`flex-1 py-2 text-sm font-medium rounded-full border transition-colors ${
                  playstyleTab === tab
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {PLAYSTYLE_CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => {
            const catItems = grouped[cat]
            const allInCat = catItems.every((a) => playstyleIds.includes(a.id))
            return (
              <div key={cat}>
                <div className="px-5 py-2 bg-slate-800/40 border-b border-slate-700/60">
                  <h3 className="text-sm font-bold text-white mb-1.5">{cat}</h3>
                  <div onClick={() => toggleCategoryAll(catItems)} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={allInCat} />
                    <span className="text-xs text-slate-400">Select All</span>
                  </div>
                </div>
                {catItems.map((ability) => (
                  <div key={ability.id} onClick={() => toggleAbility(ability.id)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/60 cursor-pointer border-b border-slate-700/40">
                    {ability.imageUrl ? (
                      <Image src={ability.imageUrl} alt="" width={36} height={36} className="object-contain shrink-0" unoptimized />
                    ) : (
                      <span className="w-9 h-9 shrink-0" />
                    )}
                    <span className="text-base text-slate-200 flex-1">{ability.label}</span>
                    <Checkbox checked={playstyleIds.includes(ability.id)} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Main panel ───────────────────────────────────────────────────────────
  const navRows: { key: Page; label: string; count: number }[] = [
    { key: 'leagues', label: 'Leagues & Teams', count: teamIds.length },
    { key: 'position', label: 'Position', count: positions.length },
    { key: 'nation', label: 'Nation', count: nationalities.length },
    { key: 'playstyles', label: 'PlayStyles', count: playstyleIds.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-y-auto">
        {/* Gender tabs */}
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex bg-slate-800 rounded-full p-0.5">
            {[
              { value: '', label: 'All' },
              { value: "Men's Football", label: "Men's\nFootball" },
              { value: "Women's Football", label: "Women's\nFootball" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setGender(value); router.push(buildUrl({ gender: value })) }}
                className={`flex-1 py-2 text-xs font-medium rounded-full transition-colors leading-tight ${
                  gender === value ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* Nav rows */}
        <div className="border-b border-slate-700">
          {navRows.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setActivePage(key); setSubSearch('') }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors border-b border-slate-700/50 last:border-b-0"
            >
              <span className="text-sm text-slate-200">{label}</span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="bg-slate-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {count}
                  </span>
                )}
                <span className="text-slate-500"><ChevronRightIcon /></span>
              </div>
            </button>
          ))}
        </div>

        {/* Sort by — vertical divider + horizontal dividers after rows 0 and 1, no outer border */}
        <div className="px-5 py-4">
          <h3 className="text-sm font-bold text-white mb-3">Sort by</h3>
          <div className="grid grid-cols-2">
            {SORT_OPTIONS.map((opt, i) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:text-white transition-colors ${
                  i % 2 === 0 ? 'border-r border-slate-700 pr-4' : 'pl-4'
                } ${i < 4 ? 'border-b border-slate-700/50' : ''}`}
              >
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={sort === opt.value}
                  onChange={() => { setSort(opt.value); router.push(buildUrl({ sort: opt.value })) }}
                  className="accent-emerald-500"
                />
                <span className="text-sm text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset all */}
        <div className="px-5 py-4">
          <button
            onClick={() => {
              setPositions([]); setNationalities([]); setLeagues([]); setTeamIds([])
              setPlaystyleIds([]); setGender(''); setSort('rank')
              const q = searchParams.get('q') ?? ''
              const p = new URLSearchParams()
              if (q) p.set('q', q)
              if (view === 'table') p.set('view', 'table')
              const qs = p.toString()
              router.push(qs ? `/?${qs}` : '/')
            }}
            className="w-full py-2.5 text-sm text-slate-400 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-200 transition-colors"
          >
            Reset all filters
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilterDrawer({ filterData, view }: FilterDrawerProps) {
  const [open, setOpen] = useState(false)
  const [openKey, setOpenKey] = useState(0)

  function openDrawer() {
    setOpenKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openDrawer}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors text-slate-300 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filters
        <Suspense>
          <ActiveFilterCount />
        </Suspense>
      </button>

      {/* Drawer panel */}
      <div
        className={`fixed left-0 top-0 h-full z-50 w-[400px] bg-slate-900 border-r border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Suspense key={openKey}>
          <FilterPanelContent filterData={filterData} view={view} onClose={() => setOpen(false)} />
        </Suspense>
      </div>
    </>
  )
}
