export interface PlayerAbility {
  id: string
  label: string
  description: string
  imageUrl: string
  type: {
    id: string
    label: string // "PlayStyle" | "PlayStyle+"
  }
}

export interface StatValue {
  value: number
  diff: number
}

export interface PlayerStats {
  pac: StatValue
  sho: StatValue
  pas: StatValue
  dri: StatValue
  def: StatValue
  phy: StatValue
  acceleration: StatValue
  sprintSpeed: StatValue
  finishing: StatValue
  shotPower: StatValue
  longShots: StatValue
  volleys: StatValue
  penalties: StatValue
  positioning: StatValue
  crossing: StatValue
  curve: StatValue
  freeKickAccuracy: StatValue
  longPassing: StatValue
  shortPassing: StatValue
  vision: StatValue
  agility: StatValue
  balance: StatValue
  reactions: StatValue
  ballControl: StatValue
  dribbling: StatValue
  composure: StatValue
  interceptions: StatValue
  defensiveAwareness: StatValue
  standingTackle: StatValue
  slidingTackle: StatValue
  jumping: StatValue
  stamina: StatValue
  strength: StatValue
  aggression: StatValue
  headingAccuracy: StatValue
  gkDiving: StatValue
  gkHandling: StatValue
  gkKicking: StatValue
  gkPositioning: StatValue
  gkReflexes: StatValue
}

export interface AlternatePosition {
  id: string
  label: string
  shortLabel: string
}

export interface Player {
  id: string
  rank: number
  overallRating: number
  firstName: string
  lastName: string
  commonName: string
  birthdate: string
  height: number
  weight: number
  skillMoves: number
  weakFootAbility: number
  preferredFoot: string
  gender: string
  nationalityId: string
  nationalityLabel: string
  nationalityImage: string
  teamId: string
  teamLabel: string
  teamImage: string
  leagueName: string
  positionId: string
  positionLabel: string
  positionShort: string
  positionType: string
  alternatePositions: AlternatePosition[]
  playerAbilities: PlayerAbility[]
  stats: PlayerStats
  avatarUrl: string
  shieldUrl: string
}

export interface PlayersResponse {
  players: Player[]
  total: number
}

// Raw API response from drop-api.ea.com
export interface EAPlayerRaw {
  id: string
  rank: number
  overallRating: number
  firstName: string
  lastName: string
  commonName: string
  birthdate: string
  height: number
  weight: number
  skillMoves: number
  weakFootAbility: number
  preferredFoot: string
  leagueName: string
  avatarUrl: string
  shieldUrl: string
  gender: { id: string; label: string }
  nationality: { id: string; label: string; imageUrl: string }
  team: { id: string; label: string; imageUrl: string; isPopular: boolean }
  position: { id: string; shortLabel: string; label: string; positionType: { id: string; name: string } }
  alternatePositions: { id: string; label: string; shortLabel: string }[]
  playerAbilities: PlayerAbility[]
  stats: Record<string, StatValue>
}
