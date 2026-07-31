export const RANKS = [
  { id: 'emt_student', title: 'EMT Student', minXp: 0 },
  { id: 'emt', title: 'EMT', minXp: 200 },
  { id: 'aemt', title: 'AEMT', minXp: 500 },
  { id: 'paramedic', title: 'Paramedic', minXp: 1000 },
  { id: 'fto', title: 'FTO', minXp: 2000 },
  { id: 'shift_captain', title: 'Shift Captain', minXp: 3500 },
] as const;

export type RankId = (typeof RANKS)[number]['id'];
