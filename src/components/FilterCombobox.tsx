'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export interface ComboOption {
  value: string
  label: string
  imageUrl?: string
  group?: string     // tab affiliation (e.g. 'PlayStyle+', 'PlayStyle')
  category?: string  // sub-grouping within a tab
}

interface FilterComboboxProps {
  label: string
  options: ComboOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  tabs?: string[]
  categoryOrder?: string[]
}

function OptionRow({
  opt,
  checked,
  onToggle,
}: {
  opt: ComboOption
  checked: boolean
  onToggle: (v: string) => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onToggle(opt.value)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-base text-left hover:bg-slate-700 transition-colors ${checked ? 'bg-slate-700/40' : ''}`}
    >
      <span
        className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
          checked ? 'bg-emerald-600 border-emerald-500' : 'border-slate-500'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {opt.imageUrl && (
        <Image
          src={opt.imageUrl}
          alt={opt.label}
          width={20}
          height={20}
          className="object-contain flex-shrink-0"
          unoptimized
        />
      )}
      <span className={`truncate ${checked ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
    </button>
  )
}

export function FilterCombobox({
  label,
  options,
  selected,
  onChange,
  placeholder,
  tabs,
  categoryOrder,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>(tabs?.[0] ?? '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Options matching search
  const searchFiltered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Tab filter (only when no search active)
  const tabFiltered = tabs && activeTab && !search
    ? searchFiltered.filter((o) => o.group === activeTab)
    : searchFiltered

  // Group by category if any option has one
  const hasCategoryGroups = tabFiltered.some((o) => o.category)
  const categoryGroups = hasCategoryGroups
    ? tabFiltered.reduce<Record<string, ComboOption[]>>((acc, o) => {
        const cat = o.category ?? 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(o)
        return acc
      }, {})
    : {}

  // Use provided categoryOrder, else sort alphabetically with 'Other' last
  const sortedCategoryKeys = hasCategoryGroups
    ? categoryOrder
        ? categoryOrder.filter((k) => categoryGroups[k]?.length > 0)
        : Object.keys(categoryGroups).sort((a, b) =>
            a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)
          )
    : []

  // Non-category group headers (original behavior when no category field)
  const hasLegacyGroups = !hasCategoryGroups && !tabs && tabFiltered.some((o) => o.group)
  const legacyGroupKeys = hasLegacyGroups
    ? [...new Set(tabFiltered.map((o) => o.group ?? ''))]
    : ['']
  const legacyGrouped = legacyGroupKeys.reduce<Record<string, ComboOption[]>>((acc, g) => {
    acc[g] = tabFiltered.filter((o) => (o.group ?? '') === g)
    return acc
  }, {})

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
  }

  return (
    <div>
      {/* Label + count badge */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {selected.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="bg-emerald-900/50 text-emerald-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {selected.length} selected
            </span>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              clear
            </button>
          </div>
        )}
      </div>

      {/* Input + dropdown */}
      <div className="relative" ref={containerRef}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={
            selected.length > 0
              ? 'Add more...'
              : (placeholder ?? `Search ${label.toLowerCase()}...`)
          }
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
        />

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
            {/* Tabs */}
            {tabs && !search && (
              <div className="flex border-b border-slate-700">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      activeTab === tab
                        ? 'text-emerald-400 border-b-2 border-emerald-500'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-52 overflow-y-auto">
              {tabFiltered.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-slate-500">No results</div>
              ) : hasCategoryGroups ? (
                sortedCategoryKeys.map((cat) => (
                  <div key={cat}>
                    <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-900/60 sticky top-0">
                      {cat}
                    </div>
                    {categoryGroups[cat].map((opt) => (
                      <OptionRow
                        key={opt.value}
                        opt={opt}
                        checked={selected.includes(opt.value)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                ))
              ) : hasLegacyGroups ? (
                legacyGroupKeys
                  .filter((g) => legacyGrouped[g]?.length > 0)
                  .map((groupKey) => (
                    <div key={groupKey}>
                      {groupKey && (
                        <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-900/60 sticky top-0">
                          {groupKey}
                        </div>
                      )}
                      {legacyGrouped[groupKey].map((opt) => (
                        <OptionRow
                          key={opt.value}
                          opt={opt}
                          checked={selected.includes(opt.value)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  ))
              ) : (
                tabFiltered.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    opt={opt}
                    checked={selected.includes(opt.value)}
                    onToggle={toggle}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
