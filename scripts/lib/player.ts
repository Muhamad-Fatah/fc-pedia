import type { EAPlayerRaw } from '../../src/lib/types.js'

export function mapPlayer(raw: EAPlayerRaw) {
  const abilities = raw.playerAbilities ?? []
  const abilityIds = abilities.map((a) => a.id).join(',')
  return {
    id: raw.id,
    rank: raw.rank,
    overall_rating: raw.overallRating,
    first_name: raw.firstName ?? '',
    last_name: raw.lastName ?? '',
    common_name: raw.commonName ?? '',
    birthdate: raw.birthdate ?? '',
    height: raw.height ?? 0,
    weight: raw.weight ?? 0,
    skill_moves: raw.skillMoves ?? 0,
    weak_foot: raw.weakFootAbility ?? 0,
    preferred_foot: raw.preferredFoot ?? '',
    gender: raw.gender?.label ?? 'Male',
    nationality_id: raw.nationality?.id ?? '',
    nationality_label: raw.nationality?.label ?? '',
    nationality_image: raw.nationality?.imageUrl ?? '',
    team_id: raw.team?.id ?? '',
    team_label: raw.team?.label ?? '',
    team_image: raw.team?.imageUrl ?? '',
    league_name: raw.leagueName ?? '',
    position_id: raw.position?.id ?? '',
    position_label: raw.position?.label ?? '',
    position_short: raw.position?.shortLabel ?? '',
    position_type: raw.position?.positionType?.name ?? '',
    alternate_positions: JSON.stringify(raw.alternatePositions ?? []),
    player_abilities: JSON.stringify(abilities),
    ability_ids: abilityIds ? `,${abilityIds},` : '',
    stats: JSON.stringify(raw.stats ?? {}),
    avatar_url: raw.avatarUrl ?? '',
    shield_url: raw.shieldUrl ?? '',
  }
}

export const INSERT_SQL = `
  INSERT OR REPLACE INTO players VALUES (
    :id, :rank, :overall_rating, :first_name, :last_name, :common_name, :birthdate,
    :height, :weight, :skill_moves, :weak_foot, :preferred_foot, :gender,
    :nationality_id, :nationality_label, :nationality_image, :team_id, :team_label,
    :team_image, :league_name, :position_id, :position_label, :position_short,
    :position_type, :alternate_positions, :player_abilities, :ability_ids, :stats,
    :avatar_url, :shield_url
  )
`