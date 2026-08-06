/** Short coach pings — random scenario prompts and field tips. */

export type CoachTipKind = 'scenario' | 'tip' | 'fact';

export interface CoachTip {
  id: string;
  kind: CoachTipKind;
  title: string;
  body: string;
}

export const COACH_TIPS: CoachTip[] = [
  {
    id: 'sc-chest-pain',
    kind: 'scenario',
    title: 'Think it through',
    body: '45yo with crushing chest pain, diaphoretic. What is your size-up, then Rapid vs Focused?',
  },
  {
    id: 'sc-unresponsive',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Unresponsive adult, agonal breaths. Order of operations after BSI and scene safety?',
  },
  {
    id: 'sc-bleeding',
    kind: 'scenario',
    title: 'Think it through',
    body: 'MVC, arterial bleeding from a thigh. What do you treat the moment you find it?',
  },
  {
    id: 'sc-asthma',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Teen with severe asthma, SpO₂ 88%. What comes before a long SAMPLE history?',
  },
  {
    id: 'sc-stroke',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Sudden facial droop and aphasia. Destination and transport mode — what are you thinking?',
  },
  {
    id: 'sc-anaphylaxis',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Hive outbreak, wheezing after a bee sting. Life threat treatment before destination?',
  },
  {
    id: 'sc-ob',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Crowning on scene. Stay and play vs load and go — what changes your call?',
  },
  {
    id: 'sc-hypoglycemia',
    kind: 'scenario',
    title: 'Think it through',
    body: 'Confused diabetic, BGL 42. What must you confirm before oral glucose?',
  },
  {
    id: 'tip-bsi',
    kind: 'tip',
    title: 'Field tip',
    body: 'BSI / PPE before patient contact — every call, every time. Build the habit.',
  },
  {
    id: 'tip-treat-find',
    kind: 'tip',
    title: 'Field tip',
    body: 'Find a life threat → treat it. Do not finish the whole primary before fixing ABCs.',
  },
  {
    id: 'tip-reassess',
    kind: 'tip',
    title: 'Field tip',
    body: 'Reassess after interventions. Vitals and mental status tell you if the patient is changing.',
  },
  {
    id: 'tip-load-go',
    kind: 'tip',
    title: 'Field tip',
    body: 'Load and go means continue care en route — packaging is not the end of assessment.',
  },
  {
    id: 'tip-radio',
    kind: 'tip',
    title: 'Field tip',
    body: 'Early hospital notification buys the ED time. Keep the radio report concise and ordered.',
  },
  {
    id: 'tip-cspine',
    kind: 'tip',
    title: 'Field tip',
    body: 'MOI that warrants C-spine? Verbalize precautions early — do not wait for a full secondary.',
  },
  {
    id: 'fact-sample',
    kind: 'fact',
    title: 'EMT fact',
    body: 'SAMPLE and OPQRST support treatment decisions — they should not delay airway or bleeding control.',
  },
  {
    id: 'fact-spo2',
    kind: 'fact',
    title: 'EMT fact',
    body: 'SpO₂ under 90% is a treat-now finding. Oxygen / ventilation before stacking more vitals.',
  },
  {
    id: 'fact-avpu',
    kind: 'fact',
    title: 'EMT fact',
    body: 'AVPU is your first mental-status snapshot. Unresponsive → Rapid Assessment and ABCs.',
  },
  {
    id: 'fact-stay-play',
    kind: 'fact',
    title: 'EMT fact',
    body: 'Stay and Play ends care on scene. Transport needs destination and mode, then handoff.',
  },
];

export function pickRandomCoachTip(excludeId?: string | null): CoachTip {
  const pool =
    excludeId != null ? COACH_TIPS.filter((t) => t.id !== excludeId) : COACH_TIPS;
  const list = pool.length ? pool : COACH_TIPS;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function formatCoachTipMessage(tip: CoachTip): string {
  return `EMT Coach · ${tip.title}\n\n${tip.body}\n\n— EMT Response Simulator`;
}
