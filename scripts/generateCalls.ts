import { generateCall } from '../data/generators/callGenerator';

const COUNT = 100;

console.log(`Generating ${COUNT} random dispatch calls...\n`);

for (let i = 0; i < COUNT; i += 1) {
  const { patient } = generateCall({ seed: i + 1 });

  const call = {
    dispatch: patient.dispatch,
    age: patient.age,
    history: patient.history,
    findings: patient.findings,
    vitals: {
      bp: patient.vitals.bp,
      hr: patient.vitals.hr,
    },
  };

  console.log(JSON.stringify(call, null, 2));
  if (i < COUNT - 1) console.log('');
}
