import { generateCall } from '../data/generators/callGenerator';
import { CONDITION_REGISTRY, CORE_CONDITION_IDS } from '../data/conditions/conditionRegistry';

const MILESTONE_DISPATCHES = [
  'Difficulty Breathing',
  'Chest Pain',
  'AMS',
  'Palpitations',
] as const;

function previewCall(dispatch: string, seed: number) {
  const call = generateCall(dispatch, { seed });
  const { patient, hiddenConditionId } = call;

  return {
    dispatch: patient.dispatch,
    hiddenCondition: hiddenConditionId,
    conditionName: CONDITION_REGISTRY[hiddenConditionId].name,
    category: CONDITION_REGISTRY[hiddenConditionId].category,
    age: patient.age,
    history: patient.history,
    findings: patient.findings,
    vitals: {
      bp: patient.vitals.bp,
      hr: patient.vitals.hr,
      rr: patient.vitals.rr,
      spo2: patient.vitals.spo2,
    },
  };
}

console.log(`Registered ${CORE_CONDITION_IDS.length} conditions:\n`);
for (const id of CORE_CONDITION_IDS) {
  const c = CONDITION_REGISTRY[id];
  console.log(`  • ${c.name} (${c.category})`);
}

console.log('\n--- Milestone dispatch generators ---\n');

for (const dispatch of MILESTONE_DISPATCHES) {
  console.log(`generateCall("${dispatch}") — 3 samples:\n`);

  for (let seed = 1; seed <= 3; seed += 1) {
    console.log(JSON.stringify(previewCall(dispatch, seed * 100), null, 2));
    console.log('');
  }
}
