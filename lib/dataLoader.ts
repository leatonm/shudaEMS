import type { Action, Protocol, Scenario } from '@/types/models';

import { CORE_CONDITION_IDS } from '@/data/conditions/conditionRegistry';
import { generateCall } from '@/data/generators/callGenerator';
import { applyProtocolCode, getProtocolCode } from '@/data/protocols/protocolCodes';
import actionsData from '@/data/actions.json';
import dataIndex from '@/data/index.json';
import anginaProtocol from '@/data/protocols/angina.json';
import cardiogenicShockProtocol from '@/data/protocols/cardiogenic_shock.json';
import chfProtocol from '@/data/protocols/chf.json';
import eclampsiaProtocol from '@/data/protocols/eclampsia.json';
import hypoglycemiaProtocol from '@/data/protocols/hypoglycemia.json';
import pulmonaryEmbolismProtocol from '@/data/protocols/pulmonary_embolism.json';
import respiratoryProtocol from '@/data/protocols/respiratory.json';
import sepsisProtocol from '@/data/protocols/sepsis.json';
import seizureProtocol from '@/data/protocols/seizure.json';
import stemiProtocol from '@/data/protocols/stemi.json';
import strokeProtocol from '@/data/protocols/stroke.json';
import anaphylaxisProtocol from '@/data/protocols/anaphylaxis.json';
import monomorphicVtProtocol from '@/data/protocols/monomorphic_vt.json';
import torsadesProtocol from '@/data/protocols/torsades.json';
import chfCalls from '@/data/scenarios/chf_calls.json';
import respiratoryCalls from '@/data/scenarios/respiratory_calls.json';
import seizureCalls from '@/data/scenarios/seizure_calls.json';
import sepsisCalls from '@/data/scenarios/sepsis_calls.json';
import stemiCalls from '@/data/scenarios/stemi_calls.json';

const PROTOCOL_REGISTRY: Record<string, Protocol> = {
  sepsis: sepsisProtocol as Protocol,
  chf: chfProtocol as Protocol,
  cardiogenic_shock: cardiogenicShockProtocol as Protocol,
  respiratory: respiratoryProtocol as Protocol,
  seizure: seizureProtocol as Protocol,
  hypoglycemia: hypoglycemiaProtocol as Protocol,
  eclampsia: eclampsiaProtocol as Protocol,
  stemi: stemiProtocol as Protocol,
  stroke: strokeProtocol as Protocol,
  anaphylaxis: anaphylaxisProtocol as Protocol,
  monomorphic_vt: monomorphicVtProtocol as Protocol,
  torsades: torsadesProtocol as Protocol,
  angina: anginaProtocol as Protocol,
  pulmonary_embolism: pulmonaryEmbolismProtocol as Protocol,
};

const SCENARIO_REGISTRY: Record<string, Scenario[]> = {
  sepsis_calls: sepsisCalls as unknown as Scenario[],
  chf_calls: chfCalls as unknown as Scenario[],
  respiratory_calls: respiratoryCalls as unknown as Scenario[],
  seizure_calls: seizureCalls as unknown as Scenario[],
  stemi_calls: stemiCalls as unknown as Scenario[],
};

export interface GameData {
  protocols: Record<string, Protocol>;
  scenarios: Scenario[];
  actions: Record<string, Action>;
  coreConditionIds: typeof CORE_CONDITION_IDS;
}

export function loadGameData(): GameData {
  const protocols: Record<string, Protocol> = {};

  for (const id of dataIndex.protocolIds) {
    const protocol = PROTOCOL_REGISTRY[id];
    if (protocol) {
      protocols[id] = applyProtocolCode(protocol as Protocol);
    }
  }

  const scenarios: Scenario[] = [];
  for (const fileKey of dataIndex.scenarioFiles) {
    const fileScenarios = SCENARIO_REGISTRY[fileKey];
    if (fileScenarios) {
      for (const scenario of fileScenarios) {
        scenarios.push({
          ...scenario,
          debrief: {
            ...scenario.debrief,
            protocolUsed: getProtocolCode(
              scenario.protocolId,
              scenario.debrief.protocolUsed
            ),
          },
        });
      }
    }
  }

  const actions: Record<string, Action> = {};
  for (const action of actionsData as Action[]) {
    actions[action.id] = action;
  }

  return { protocols, scenarios, actions, coreConditionIds: CORE_CONDITION_IDS };
}

/**
 * Picks the next shift call.
 * ~70% dispatch-first generated calls, ~30% hand-crafted static trap scenarios.
 */
export function pickNextShiftCall(
  scenarios: Scenario[],
  completedIds: string[],
  useGenerator = true
): Scenario {
  const remaining = scenarios.filter((s) => !completedIds.includes(s.id));
  const staticPool = remaining.length > 0 ? remaining : scenarios;
  const canUseStatic = staticPool.length > 0;

  if (useGenerator && (!canUseStatic || Math.random() < 0.7)) {
    return generateCall().scenario;
  }

  return staticPool[Math.floor(Math.random() * staticPool.length)];
}
