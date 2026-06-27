import { getDb } from '@/lib/db'
import { PlaystyleBadge } from '@/components/PlaystyleBadge'
import type { PlayerAbility } from '@/lib/types'
import { PLAYSTYLE_CATEGORY_ORDER, categorizePlaystyle } from '@/lib/playstyle-categories'

export default async function PlayStylesPage() {
  const db = getDb()

  // Gather all unique abilities from the DB
  let abilityMap = new Map<string, PlayerAbility & { playerCount: number }>()

  try {
    const [abResult, countResult] = await Promise.all([
      db.execute(`SELECT player_abilities FROM players WHERE player_abilities != '[]' LIMIT 5000`),
      db.execute(`SELECT ability_ids FROM players WHERE ability_ids != ''`),
    ])

    for (const row of abResult.rows) {
      const abilities = JSON.parse((row.player_abilities as string) || '[]') as PlayerAbility[]
      for (const a of abilities) {
        if (!abilityMap.has(a.id)) {
          abilityMap.set(a.id, { ...a, playerCount: 0 })
        }
      }
    }

    const playerCounts = new Map<string, number>()
    for (const row of countResult.rows) {
      const ids = (row.ability_ids as string).split(',').filter(Boolean)
      for (const id of ids) {
        playerCounts.set(id, (playerCounts.get(id) ?? 0) + 1)
      }
    }

    for (const [id, ability] of abilityMap) {
      ability.playerCount = playerCounts.get(id) ?? 0
    }
  } catch { /* DB not ready */ }

  const abilities = Array.from(abilityMap.values())

  // Group by type (PlayStyle vs PlayStyle+)
  const plusAbilities = abilities.filter((a) => a.type?.label === 'Play Style Plus')
  const baseAbilities = abilities.filter((a) => a.type?.label !== 'Play Style Plus')

  const grouped = new Map<string, (PlayerAbility & { playerCount: number })[]>()

  for (const cat of PLAYSTYLE_CATEGORY_ORDER) grouped.set(cat, [])

  for (const a of baseAbilities) {
    const cat = categorizePlaystyle(a.label)
    grouped.get(cat)?.push(a) ?? grouped.set(cat, [a])
  }

  const plusByLabel = new Map(plusAbilities.map((a) => [a.label, a]))

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-white mb-2">PlayStyles</h1>
      <p className="text-slate-400 mb-8">
        All {abilities.length} PlayStyles in EA Sports FC 26, grouped by category.
        <span className="ml-2 inline-flex items-center gap-1 text-sm">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="text-amber-400 font-medium">Gold = PlayStyle+</span>
        </span>
      </p>

      {/* PlayStyle+ section */}
      {plusAbilities.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span>★</span> PlayStyle+
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plusAbilities.map((a) => (
              <AbilityCard key={a.id} ability={a} />
            ))}
          </div>
        </div>
      )}

      {/* By category */}
      {PLAYSTYLE_CATEGORY_ORDER.map((cat) => {
        const catAbilities = grouped.get(cat) ?? []
        if (catAbilities.length === 0) return null
        return (
          <div key={cat} className="mb-10">
            <h2 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catAbilities.map((a) => {
                const plus = plusByLabel.get(a.label)
                return <AbilityCard key={a.id} ability={a} plusAbility={plus} />
              })}
            </div>
          </div>
        )
      })}

      {abilities.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>No playstyle data yet.</p>
          <p className="text-sm mt-1">Run <code className="text-emerald-400">npm run ingest</code> first.</p>
        </div>
      )}
    </div>
  )
}

function AbilityCard({
  ability,
  plusAbility,
}: {
  ability: PlayerAbility & { playerCount: number }
  plusAbility?: PlayerAbility & { playerCount: number }
}) {
  const isPlus = ability.type?.label === 'Play Style Plus'
  return (
    <div className={`bg-slate-800 border rounded-xl p-4 ${isPlus ? 'border-amber-500/40' : 'border-slate-700'}`}>
      <div className="flex items-start gap-3 mb-2">
        {ability.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ability.imageUrl}
            alt=""
            width={36}
            height={36}
            className="object-contain flex-shrink-0 mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <PlaystyleBadge ability={ability} />
            {ability.playerCount > 0 && (
              <span className="text-xs text-slate-500 flex-shrink-0">{ability.playerCount.toLocaleString()} players</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{ability.description || '—'}</p>
      {plusAbility && !isPlus && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <PlaystyleBadge ability={plusAbility} size="sm" />
            {plusAbility.playerCount > 0 && (
              <span className="text-xs text-slate-500">{plusAbility.playerCount.toLocaleString()} players</span>
            )}
          </div>
          {plusAbility.description && plusAbility.description !== ability.description && (
            <p className="text-xs text-slate-500 leading-relaxed">{plusAbility.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
