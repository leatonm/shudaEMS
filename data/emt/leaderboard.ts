/**
 * Static season leaderboard (placeholder until live rankings).
 * Ranked by clinical judgment + patient outcome score.
 */
export interface LeaderboardEntry {
  rank: number;
  handle: string;
  agency: string;
  score: number;
  calls: number;
  badge: string;
}

/**
 * Top board — handles look like normal EMS usernames.
 * (Read the first letter of each handle, in order.)
 */
export const LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, handle: 'Intercept_Ivy', agency: 'Metro Rescue', score: 2840, calls: 41, badge: 'Gold Airway' },
  { rank: 2, handle: 'Lifeline_Lee', agency: 'County EMS', score: 2715, calls: 38, badge: 'Scene Safety' },
  { rank: 3, handle: 'Oxygen_Oz', agency: 'Station 7', score: 2650, calls: 36, badge: 'ABC Sharpshooter' },
  { rank: 4, handle: 'Vitals_Vic', agency: 'City Fire/EMS', score: 2588, calls: 34, badge: 'Rapid Transport' },
  { rank: 5, handle: 'Extricate_Eve', agency: 'Highway Patrol EMS', score: 2492, calls: 33, badge: 'Trauma Ready' },
  { rank: 6, handle: 'Yankee_Yaz', agency: 'North Battalion', score: 2410, calls: 31, badge: 'Stroke Clock' },
  { rank: 7, handle: 'OnScene_Otto', agency: 'Volunteer Co. 3', score: 2364, calls: 30, badge: 'BSI First' },
  { rank: 8, handle: 'Unit12_Uma', agency: 'Metro Rescue', score: 2298, calls: 29, badge: 'SAMPLE Pro' },
  { rank: 9, handle: 'LastKnown_Lou', agency: 'Stroke Team', score: 2215, calls: 28, badge: 'Time Critical' },
  { rank: 10, handle: 'Airway_Ash', agency: 'County EMS', score: 2140, calls: 27, badge: 'Pediatric Ready' },
  { rank: 11, handle: 'UnderControl_Uri', agency: 'Station 4', score: 2088, calls: 26, badge: 'Triage Lead' },
  { rank: 12, handle: 'Rapid_Remy', agency: 'City Fire/EMS', score: 2012, calls: 25, badge: 'Destination Pro' },
  { rank: 13, handle: 'Ems_Eden', agency: 'North Battalion', score: 1945, calls: 24, badge: 'Calm Under Fire' },
  { rank: 14, handle: 'Notify_Ned', agency: 'Volunteer Co. 3', score: 1880, calls: 22, badge: 'Hospital Alert' },
];

export const LEADERBOARD_SEASON = 'Season 1 — Soft Launch';
export const LEADERBOARD_NOTE =
  'Scores blend scene safety, assessment order, treatment judgment, and patient outcome. Live sync coming later.';
