import { getGameplay } from '@/data/conditions/gameplayRegistry';
import type { ConditionDefinition, GeneratedPatient } from '@/data/conditions/types';
import { getProtocolCode } from '@/data/protocols/protocolCodes';
import { parseBP } from '@/lib/scenarioEngine';
import type { AssessmentOption, Scenario, TreatmentEffectStep } from '@/types/models';
import { pickRandom, randomInt, type Rng } from '@/data/generators/rng';

const UNITS = ['Medic 3', 'Engine 6', 'Medic 12', 'Medic 7', 'Engine 4'];
const ETAS = ['3 min', '4 min', '5 min', '6 min'];
const PRIORITIES = [1, 2, 2] as const;

function buildFluidBolusSteps(startBp: string, rng: Rng): TreatmentEffectStep[] {
  const { systolic, diastolic } = parseBP(startBp);
  const step1Sys = Math.min(systolic + randomInt(6, 12, rng), 120);
  const step1Dia = Math.min(diastolic + randomInt(6, 10, rng), 80);
  const step2Sys = Math.min(step1Sys + randomInt(8, 14, rng), 130);
  const step2Dia = Math.min(step1Dia + randomInt(6, 10, rng), 85);

  return [
    {
      bp: `${step1Sys}/${step1Dia}`,
      hr: randomInt(96, 108, rng),
      message: `BP improved from ${startBp} to ${step1Sys}/${step1Dia} after 500mL LR.`,
    },
    {
      bp: `${step2Sys}/${step2Dia}`,
      hr: randomInt(88, 98, rng),
      mentalStatus: 'alert',
      message: `BP improved to ${step2Sys}/${step2Dia}. MAP now above 65.`,
    },
  ];
}

function buildAssessmentOptions(
  condition: ConditionDefinition,
  patient: GeneratedPatient
): AssessmentOption[] {
  const v = patient.vitals;
  const options: AssessmentOption[] = [
    {
      id: 'vitals',
      label: 'Obtain Vitals',
      clue: `BP ${v.bp} · HR ${v.hr} · RR ${v.rr} · Temp ${v.temp}°F · SpO2 ${v.spo2}%`,
    },
    {
      id: 'lung_sounds',
      label: 'Lung Sounds',
      clue: patient.findings.some((f) => /wheez|rales|stridor/i.test(f))
        ? patient.findings.filter((f) => /wheez|rales|stridor/i.test(f)).join('. ') + '.'
        : 'Clear bilaterally.',
    },
    {
      id: 'history',
      label: 'Medical History',
      clue: `${patient.history.join(', ')}. ${patient.pearl}`,
    },
  ];

  if (condition.id === 'stemi' || condition.id === 'stroke') {
    options.push({
      id: condition.id === 'stemi' ? 'twelve_lead' : 'stroke_assessment',
      label: condition.id === 'stemi' ? '12-Lead ECG' : 'Stroke Assessment',
      clue:
        condition.id === 'stemi'
          ? 'STEMI — ST elevation on 12-lead.'
          : `Cincinnati Stroke Scale positive: ${patient.findings.slice(0, 3).join(', ')}.`,
    });
  } else if (condition.id === 'monomorphic_vt') {
    options.push({
      id: 'twelve_lead',
      label: '12-Lead ECG',
      clue: `Wide complex tachycardia at ${v.hr} bpm — regular monomorphic VT.`,
    });
  } else if (condition.id === 'torsades') {
    options.push({
      id: 'twelve_lead',
      label: '12-Lead ECG',
      clue: `Polymorphic wide complex tachycardia at ${v.hr} bpm — torsades pattern with prolonged QT.`,
    });
  } else {
    options.push({
      id: 'ecg',
      label: 'ECG',
      clue: `Sinus tachycardia at ${v.hr}. No acute ST elevation on rhythm strip.`,
    });
  }

  options.push({
    id: 'blood_sugar',
    label: 'Blood Sugar',
    clue: `${v.glucose} mg/dL.`,
  });

  return options;
}

function applyDynamicEffects(
  conditionId: ConditionDefinition['id'],
  patient: GeneratedPatient,
  effects: Scenario['treatmentEffects'],
  rng: Rng
): Scenario['treatmentEffects'] {
  let next = { ...effects };

  if (conditionId === 'sepsis') {
    next.fluid_bolus = buildFluidBolusSteps(patient.vitals.bp, rng);
  }

  if (conditionId === 'chf') {
    const { systolic, diastolic } = parseBP(patient.vitals.bp);
    const cpapSpo2 = Math.min(patient.vitals.spo2 + randomInt(4, 8, rng), 96);
    next = {
      ...next,
      cpap: { message: 'CPAP applied. Work of breathing decreased.', spo2: cpapSpo2, rr: randomInt(22, 26, rng) },
      nitro_paste: {
        message: 'Nitroglycerin paste applied with CPAP.',
        bp: `${Math.max(systolic - 14, 130)}/${Math.max(diastolic - 8, 72)}`,
        spo2: Math.min(cpapSpo2 + 2, 97),
      },
      nitroglycerin: {
        message: 'Nitroglycerin SL with CPAP — poor absorption under mask.',
        bp: `${Math.max(systolic - 24, 110)}/${Math.max(diastolic - 14, 58)}`,
        spo2: Math.max(cpapSpo2 - 4, 78),
      },
    };
  }

  if (conditionId === 'copdAsthma' || conditionId === 'anaphylaxis') {
    const albuterolSpo2 = Math.min(patient.vitals.spo2 + randomInt(2, 4, rng), 96);
    next.albuterol = { message: 'Albuterol given.', spo2: albuterolSpo2, rr: randomInt(22, 26, rng) };
  }

  return next;
}

export interface ComposeScenarioInput {
  condition: ConditionDefinition;
  patient: GeneratedPatient;
  rng?: Rng;
}

export function composeScenario({ condition, patient, rng = Math.random }: ComposeScenarioInput): Scenario {
  const gameplay = getGameplay(condition.id);
  const treatmentEffects = applyDynamicEffects(
    condition.id,
    patient,
    gameplay.treatmentEffects,
    rng
  );

  return {
    id: patient.id,
    protocolId: gameplay.protocolId,
    dispatchCard: {
      unit: pickRandom(UNITS, rng),
      priority: pickRandom([...PRIORITIES], rng),
      chiefComplaint: patient.dispatch,
      patientSummary: `${patient.age}yo ${patient.sex}`,
      eta: pickRandom(ETAS, rng),
    },
    dispatchNotes: 'Unit en route. Additional details pending on-scene assessment.',
    scene: {
      appearance: [
        `${patient.age}yo ${patient.sex} — appears in distress.`,
        `Chief complaint: ${patient.dispatch}.`,
        'Family on scene. Further assessment required.',
      ],
    },
    assessmentOptions: buildAssessmentOptions(condition, patient),
    assessment: {
      bp: patient.vitals.bp,
      hr: patient.vitals.hr,
      rr: patient.vitals.rr,
      temp: patient.vitals.temp,
      spo2: patient.vitals.spo2,
      mentalStatus: patient.difficulty === 'hard' ? 'confused' : 'alert',
    },
    correctProtocol: gameplay.correctProtocol,
    correctActions: gameplay.correctActions,
    harmfulActions: gameplay.harmfulActions,
    protocolChoices: gameplay.protocolChoices,
    treatmentActions: gameplay.treatmentActions,
    treatmentEffects,
    deterioration: {
      bp: patient.vitals.bp,
      hr: gameplay.deterioration.hr ?? patient.vitals.hr + 12,
      rr: gameplay.deterioration.rr ?? patient.vitals.rr + 4,
      temp: patient.vitals.temp,
      spo2: Math.max(patient.vitals.spo2 - 12, 62),
      mentalStatus: gameplay.deterioration.mentalStatus ?? 'obtunded',
      message: gameplay.deterioration.message,
    },
    endings: gameplay.endings,
    debrief: {
      ...gameplay.debrief,
      primaryCondition: condition.name,
      protocolUsed: getProtocolCode(gameplay.protocolId, gameplay.debrief.protocolUsed),
      keyIndicators: patient.findings,
    },
    protocolInsight: {
      title: gameplay.insight.title,
      body: patient.pearl,
    },
  };
}
