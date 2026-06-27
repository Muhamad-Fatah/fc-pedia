'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlayerFilters, type FilterData } from './PlayerFilters'

interface FilterDrawerProps {
  filterData: FilterData
  view: string
}

function ActiveFilterCount() {
  const sp = useSearchParams()
  const count = [
    sp.get('q'),
    sp.get('position'),
    sp.get('nationality'),
    sp.get('league'),
    sp.get('playstyleId'),
    sp.get('gender'),
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

export function FilterDrawer({ filterData, view }: FilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors text-slate-300 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filters
        <Suspense>
          <ActiveFilterCount />
        </Suspense>
      </button>

      {/* Drawer panel */}
      <div
        className={`fixed left-0 top-0 h-full z-50 w-[440px] bg-slate-900 border-r border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Filters</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
            aria-label="Close filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <Suspense>
            <PlayerFilters filterData={filterData} view={view} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
