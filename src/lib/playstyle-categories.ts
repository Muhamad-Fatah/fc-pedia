export const PLAYSTYLE_CATEGORIES: Record<string, string[]> = {
  Finishing: ['Finesse Shot', 'Chip Shot', 'Power Shot', 'Dead Ball', 'Precision Header', 'Gamechanger'],
  Passing: ['Pinged Pass', 'Long Ball Pass', 'Tiki Taka', 'Whipped Pass', 'Inventive'],
  Defending: ['Jockey', 'Block', 'Intercept', 'Anticipate', 'Bruiser', 'Aerial Fortress', 'Slide Tackle'],
  'Ball Control': ['First Touch', 'Flair', 'Acrobatic', 'Press Proven', 'Technical'],
  Physical: ['Relentless', 'Rapid', 'Quick Step', 'Long Throw'],
  Goalkeeper: ['Footwork', 'Cross Claimer', 'Rush Out', 'Deflector', 'Far Reach'],
}

export const PLAYSTYLE_CATEGORY_ORDER = [
  'Finishing', 'Passing', 'Ball Control', 'Defending', 'Physical', 'Goalkeeper', 'Other',
]

export function categorizePlaystyle(label: string): string {
  for (const [cat, labels] of Object.entries(PLAYSTYLE_CATEGORIES)) {
    if (labels.some((l) =>
      label.toLowerCase().includes(l.toLowerCase()) ||
      l.toLowerCase().includes(label.toLowerCase())
    )) {
      return cat
    }
  }
  return 'Other'
}
