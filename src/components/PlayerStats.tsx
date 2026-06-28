import type { PlayerStats as Stats } from '@/lib/types'

interface SubStatProps {
  label: string
  value: number
  tooltip?: string
}

function barColor(value: number) {
  if (value >= 85) return 'bg-emerald-400'
  if (value >= 70) return 'bg-lime-400'
  if (value >= 55) return 'bg-amber-400'
  if (value >= 40) return 'bg-orange-400'
  return 'bg-red-500'
}

function SubStat({ label, value, tooltip }: SubStatProps) {
  const pct = Math.min((value / 99) * 100, 100)
  return (
    <div className="relative group">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400 cursor-help underline decoration-dotted decoration-slate-600">
          {label}
        </span>
        <span className="text-xs font-bold text-white tabular-nums">{value}</span>
      </div>
      <div className="h-0.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor(value)}`} style={{ width: `${pct}%` }} />
      </div>
      {tooltip && (
        <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-52 rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {tooltip}
        </div>
      )}
    </div>
  )
}

const MAIN_STATS = [
  { key: 'pac', label: 'Pace', subs: ['acceleration', 'sprintSpeed'] },
  { key: 'sho', label: 'Shooting', subs: ['positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties'] },
  { key: 'pas', label: 'Passing', subs: ['vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve'] },
  { key: 'dri', label: 'Dribbling', subs: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'] },
  { key: 'def', label: 'Defending', subs: ['interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle'] },
  { key: 'phy', label: 'Physicality', subs: ['jumping', 'stamina', 'strength', 'aggression'] },
] as const

const SUB_LABELS: Record<string, string> = {
  acceleration: 'Acceleration', sprintSpeed: 'Sprint Speed',
  positioning: 'Positioning', finishing: 'Finishing', shotPower: 'Shot Power',
  longShots: 'Long Shots', volleys: 'Volleys', penalties: 'Penalties',
  vision: 'Vision', crossing: 'Crossing', freeKickAccuracy: 'Free Kick Accuracy',
  shortPassing: 'Short Passing', longPassing: 'Long Passing', curve: 'Curve',
  agility: 'Agility', balance: 'Balance', reactions: 'Reactions',
  ballControl: 'Ball Control', dribbling: 'Dribbling', composure: 'Composure',
  interceptions: 'Interceptions', headingAccuracy: 'Heading Accuracy',
  defensiveAwareness: 'Def Awareness', standingTackle: 'Standing Tackle', slidingTackle: 'Sliding Tackle',
  jumping: 'Jumping', stamina: 'Stamina', strength: 'Strength', aggression: 'Aggression',
}

const SUB_TOOLTIPS: Record<string, string> = {
  acceleration: 'How quickly a player reaches their maximum sprint speed.',
  sprintSpeed: 'The pace at which a player runs at full speed.',
  positioning: "The player's ability to find good positions in the box to receive the ball and score.",
  finishing: 'Accuracy when shooting inside the penalty area.',
  shotPower: 'The power behind a player\'s shots.',
  longShots: 'Accuracy and power of shots taken from outside the penalty area.',
  volleys: 'Accuracy and power of shots struck while the ball is airborne.',
  penalties: 'Accuracy when taking penalty kicks.',
  vision: 'The ability to notice and play passes that open up space in the opposition defense.',
  crossing: 'Accuracy of crosses and deliveries into the penalty area.',
  freeKickAccuracy: 'Accuracy when shooting or delivering from a dead-ball free kick.',
  shortPassing: 'Accuracy of short passes to nearby teammates.',
  longPassing: 'Accuracy of long passes across the field.',
  curve: "The player's ability to bend the ball when passing or shooting.",
  agility: 'How quickly and smoothly a player moves or changes direction while dribbling.',
  balance: 'Ability to maintain stability when being challenged by an opponent.',
  reactions: 'The speed at which a player responds to events happening around them.',
  ballControl: 'The ability to receive and control the ball with a clean first touch.',
  dribbling: 'The ability to carry the ball past opponents at speed.',
  composure: 'Calmness and control when receiving the ball or shooting under pressure.',
  interceptions: "The ability to read the game and cut out opponents' passes.",
  headingAccuracy: 'Accuracy and power when heading the ball, both in attack and defense.',
  defensiveAwareness: "The player's ability to position themselves defensively and track opposition runs.",
  standingTackle: 'The ability to win the ball cleanly using a standing tackle.',
  slidingTackle: 'The ability to win the ball cleanly using a sliding tackle.',
  jumping: "The height and timing of a player's jump for aerial contests.",
  stamina: 'How long a player can sustain their performance level before fatigue sets in.',
  strength: 'Physical power used to win shoulder-to-shoulder challenges and hold off opponents.',
  aggression: "The intensity of a player's tackles, interceptions, and pressing runs.",
}

const GK_TOOLTIPS: Record<string, string> = {
  gkDiving: 'The ability to dive and make saves to the side.',
  gkHandling: 'The ability to catch or punch the ball cleanly.',
  gkKicking: 'The power and accuracy of goal kicks and clearances.',
  gkPositioning: "The goalkeeper's ability to position themselves to make saves.",
  gkReflexes: 'The speed of reaction to make close-range saves.',
}

interface Props {
  stats: Stats
  isGK?: boolean
}

export function PlayerStats({ stats, isGK }: Props) {
  if (isGK) {
    return (
      <div className="space-y-2">
        {[
          { key: 'gkDiving', label: 'Diving' },
          { key: 'gkHandling', label: 'Handling' },
          { key: 'gkKicking', label: 'Kicking' },
          { key: 'gkPositioning', label: 'Positioning' },
          { key: 'gkReflexes', label: 'Reflexes' },
        ].map(({ key, label }) => (
          <SubStat
            key={key}
            label={label}
            value={(stats[key as keyof Stats] as { value: number })?.value ?? 0}
            tooltip={GK_TOOLTIPS[key]}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
      {MAIN_STATS.map(({ key, label, subs }) => {
        const val = (stats[key as keyof Stats] as { value: number })?.value ?? 0
        return (
          <div key={key} className="space-y-3">
            <div className="flex justify-between items-baseline border-b border-slate-700 pb-2">
              <span className="text-sm font-bold text-white">{label}</span>
              <span className="text-xl font-black text-white">{val}</span>
            </div>
            <div className="space-y-2.5">
              {subs.map((sub) => (
                <SubStat
                  key={sub}
                  label={SUB_LABELS[sub] ?? sub}
                  value={(stats[sub as keyof Stats] as { value: number })?.value ?? 0}
                  tooltip={SUB_TOOLTIPS[sub]}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
