import type {
  Action,
  CaseReviewSnapshot,
  Protocol,
  Scenario,
  TreatmentReviewItem,
} from '@/types/models';
import { getProtocolCode } from '@/data/protocols/protocolCodes';

function actionLabel(actionId: string, actions: Record<string, Action>): string {
  return actions[actionId]?.name ?? actionId.replace(/_/g, ' ');
}

function protocolLabel(protocolId: string | null, protocols: Record<string, Protocol>): string {
  if (!protocolId) return 'No diagnosis selected';
  return protocols[protocolId]?.name ?? protocolId;
}

function isSlNitroWithCpap(scenario: Scenario, appliedActions: string[]): boolean {
  return (
    appliedActions.includes('cpap') &&
    appliedActions.includes('nitroglycerin') &&
    scenario.correctActions.includes('nitro_paste') &&
    !scenario.correctActions.includes('nitroglycerin')
  );
}

export function buildCaseReview(
  scenario: Scenario,
  protocol: Protocol,
  actions: Record<string, Action>,
  appliedActions: string[],
  selectedProtocolId: string | null,
  protocols: Record<string, Protocol>
): CaseReviewSnapshot {
  const neutral = new Set(protocol.neutralActions ?? []);
  const harmful = new Set(scenario.harmfulActions ?? []);
  const required = scenario.correctActions;

  const treatmentReview: TreatmentReviewItem[] = [];

  for (const actionId of required) {
    treatmentReview.push({
      label: actionLabel(actionId, actions),
      status: appliedActions.includes(actionId) ? 'done' : 'missed',
    });
  }

  for (const actionId of harmful) {
    if (appliedActions.includes(actionId)) {
      treatmentReview.push({
        label: actionLabel(actionId, actions),
        status: 'harmful',
      });
    }
  }

  if (isSlNitroWithCpap(scenario, appliedActions)) {
    treatmentReview.push({
      label: 'Nitroglycerin SL with CPAP',
      status: 'harmful',
    });
  }

  for (const actionId of appliedActions) {
    if (required.includes(actionId) || harmful.has(actionId)) continue;
    if (neutral.has(actionId)) continue;
    if (actionId === 'nitroglycerin' && isSlNitroWithCpap(scenario, appliedActions)) continue;

    treatmentReview.push({
      label: actionLabel(actionId, actions),
      status: 'unnecessary',
    });
  }

  return {
    protocolName: protocol.name,
    protocolCode: getProtocolCode(
      protocol.id,
      protocol.protocolCode || scenario.debrief.protocolUsed
    ),
    whyThisPatient: scenario.debrief.keyIndicators,
    protocolCriteria: protocol.keyIndicators,
    protocolInterventions: protocol.interventions,
    diagnosisReview: {
      youChose: protocolLabel(selectedProtocolId, protocols),
      correctAnswer: protocolLabel(scenario.correctProtocol, protocols),
      wasCorrect: selectedProtocolId === scenario.correctProtocol,
    },
    treatmentReview,
  };
}
