import {
  ACTION_MENUS,
  type ActionMenuNode,
  type ActionMenuRoot,
} from '@/data/emt/actionMenu';
import type { NremtStage } from '@/data/emt/nremtFlow';
import { getNremtStage, stageCoverage } from '@/data/emt/nremtFlow';
import type { CallCategory, EmtCall } from '@/data/emt/types';
import { isArrestPriority } from '@/data/emt/laurenCoach';

export interface StageQuickAction {
  label: string;
  /** Fire this action if set (must exist as a real menu leaf). */
  actionId?: string;
  /** Navigate into this menu instead of firing. */
  openRoot?: ActionMenuRoot;
  openPath?: string[];
}

export interface StageFocus {
  title: string;
  hint: string;
  openRoot: ActionMenuRoot;
  openPath: string[];
  advanceHint: string;
  quickActions: StageQuickAction[];
}

interface MenuLeaf {
  label: string;
  actionId: string;
  root: ActionMenuRoot;
  path: string[];
}

/** Flat index of every tappable leaf in ACTION_MENUS (source of truth). */
function collectLeaves(
  root: ActionMenuRoot,
  nodes: ActionMenuNode[],
  path: string[] = [],
  out: MenuLeaf[] = []
): MenuLeaf[] {
  for (const node of nodes) {
    if (node.alsOnly) continue;
    if (node.children?.length) {
      collectLeaves(root, node.children, [...path, node.id], out);
      continue;
    }
    if (node.actionId) {
      out.push({
        label: node.label,
        actionId: node.actionId,
        root,
        path,
      });
    }
  }
  return out;
}

function allLeaves(): MenuLeaf[] {
  // Rebuild each call in case menus change during hot reload.
  const out: MenuLeaf[] = [];
  (Object.keys(ACTION_MENUS) as ActionMenuRoot[]).forEach((root) => {
    collectLeaves(root, ACTION_MENUS[root], [], out);
  });
  return out;
}

function leafByAction(actionId: string): MenuLeaf | undefined {
  return allLeaves().find((l) => l.actionId === actionId);
}

/** Only suggest actions that exist in the real menus — include where they live. */
function suggestLeaf(
  actionId: string,
  labelOverride?: string
): StageQuickAction | null {
  const leaf = leafByAction(actionId);
  if (!leaf) return null;
  return {
    label: labelOverride ?? leaf.label,
    actionId: leaf.actionId,
    // So the chip always lands on the folder that actually contains this option.
    openRoot: leaf.root,
    openPath: leaf.path,
  };
}

function suggestFolder(
  label: string,
  openRoot: ActionMenuRoot,
  openPath: string[] = []
): StageQuickAction {
  return { label, openRoot, openPath };
}

function undones(ids: string[], done: Set<string>): StageQuickAction[] {
  return ids
    .filter((id) => !done.has(id))
    .map((id) => suggestLeaf(id))
    .filter((a): a is StageQuickAction => Boolean(a));
}

/**
 * Soft stage focus — guidance only. Never invents options outside ACTION_MENUS.
 * Player stays free to open any menu.
 */
export function getStageFocus(
  stageId: NremtStage,
  call: EmtCall,
  completedActions: string[]
): StageFocus {
  const stage = getNremtStage(stageId, call.category);
  const coverage = stageCoverage(stage, completedActions);
  const done = new Set(completedActions);
  const arrest = isArrestPriority(call, call.vitals);

  switch (stageId) {
    case 'scene_sizeup': {
      const quick = undones(
        [
          'don_ppe',
          'verbalize_scene_safe',
          'count_patients',
          'assess_moi',
          'consider_resources',
          'c_spine',
        ],
        done
      );
      return {
        title: 'Scene Size-Up',
        hint: nextSizeUpHint(done, call.category, coverage.missing),
        openRoot: 'scene',
        openPath: [],
        advanceHint: 'When ready → MAKE PATIENT CONTACT (bottom)',
        quickActions: quick.slice(0, 6),
      };
    }

    case 'primary_survey': {
      const quick: StageQuickAction[] = [];
      // Assessment root first — Impression lives here, NOT inside Primary.
      quick.push(suggestFolder('Assessment', 'assessment', []));
      if (!done.has('general_impression')) {
        const leaf = suggestLeaf('general_impression', 'Impression');
        if (leaf) quick.push(leaf);
      }
      quick.push(suggestFolder('Primary (xABC)', 'assessment', ['primary']));
      if (arrest) {
        quick.push(suggestFolder('CPR / AED', 'interventions', ['int_cardiac']));
      } else {
        quick.push(suggestFolder('Oxygen', 'interventions', ['int_breathing']));
      }
      quick.push(suggestFolder('Treatment', 'interventions', []));

      return {
        title: 'Primary Survey',
        hint: arrest
          ? 'Free pick any menu. Guide: Assessment for Impression + Primary; Treatment → Cardiac for CPR/AED.'
          : 'Free pick any menu. Guide: Assessment for Impression + Primary (xABC); Treatment for O₂ / bleeding / CPR.',
        openRoot: 'assessment',
        openPath: [],
        advanceHint: 'When primary is enough → HISTORY TAKING (bottom)',
        quickActions: dedupeQuick(quick).slice(0, 8),
      };
    }

    case 'history': {
      const quick = [
        suggestFolder('History folder', 'assessment', ['history']),
        ...undones(['opqrst', 'sample', 'allergies', 'medications_hx', 'pmh', 'events'], done),
      ];
      return {
        title: 'History',
        hint: 'Assessment → History. OPQRST and SAMPLE are inside that folder.',
        openRoot: 'assessment',
        openPath: ['history'],
        advanceHint: 'When ready → SECONDARY ASSESSMENT (bottom)',
        quickActions: dedupeQuick(quick).slice(0, 7),
      };
    }

    case 'secondary': {
      const quick = [
        ...undones(['secondary_assessment', 'skin_signs'], done),
        // cap_refill lives under Assessment → Vitals in the real menu
        suggestFolder('Cap refill ›', 'assessment', ['vitals']),
        // lung_sounds lives under Treatment → Breathing
        suggestFolder('Lung sounds ›', 'interventions', ['int_breathing']),
      ];
      return {
        title: 'Secondary',
        hint: 'Focused Assessment + Skin Signs are under Assessment. Lung sounds are under Treatment → Breathing.',
        openRoot: 'assessment',
        openPath: [],
        advanceHint: 'When ready → VITAL SIGNS (bottom)',
        quickActions: dedupeQuick(quick).slice(0, 6),
      };
    }

    case 'vitals': {
      const quick = [
        suggestFolder('Vitals folder', 'assessment', ['vitals']),
        ...undones(
          ['vital_bp', 'vital_pulse', 'vital_rr', 'check_spo2', 'blood_glucose'],
          done
        ),
        suggestFolder('Treatment', 'interventions', []),
      ];
      return {
        title: 'Vital Signs',
        hint: 'Assessment → Vitals for numbers. If a value is critical, treat it under Treatment.',
        openRoot: 'assessment',
        openPath: ['vitals'],
        advanceHint: 'When ready → REASSESSMENT (bottom)',
        quickActions: dedupeQuick(quick).slice(0, 7),
      };
    }

    case 'reassessment':
      return {
        title: 'Reassessment',
        hint: 'Reassessment is under Assessment. Use Treatment if you still need interventions.',
        openRoot: 'assessment',
        openPath: [],
        advanceHint: 'When ready → VERBAL REPORT (bottom)',
        quickActions: dedupeQuick([
          ...undones(['reassessment'], done),
          suggestFolder('Treatment', 'interventions', []),
          suggestFolder('Transport', 'transport', []),
        ]),
      };

    case 'report':
      return {
        title: 'Verbal Report',
        hint: 'Transport menu — Stay and Play or Load and Go, then Transport for destination and mode. Handoff opens when both are set.',
        openRoot: 'transport',
        openPath: [],
        advanceHint: 'Set destination + mode to hand off',
        quickActions: undones(['stay_and_play', 'load_and_go'], done),
      };
  }
}

function dedupeQuick(actions: StageQuickAction[]): StageQuickAction[] {
  const seen = new Set<string>();
  const out: StageQuickAction[] = [];
  for (const a of actions) {
    const key = a.actionId
      ? `act:${a.actionId}`
      : `nav:${a.openRoot}:${(a.openPath ?? []).join('/')}:${a.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function nextSizeUpHint(
  done: Set<string>,
  category: CallCategory,
  missing: string[]
): string {
  if (!done.has('don_ppe')) return 'Start in Size-Up: PPE / BSI.';
  if (!done.has('verbalize_scene_safe')) return 'Size-Up: Is the scene safe?';
  if (!done.has('count_patients')) return 'Size-Up: Number of patients.';
  if (
    !done.has('assess_moi') &&
    !done.has('declare_moi') &&
    !done.has('declare_noi')
  ) {
    return 'Size-Up: MOI or NOI.';
  }
  if (
    missing.includes('consider_resources') ||
    (!done.has('consider_resources') &&
      !done.has('resource_pick_none') &&
      !done.has('request_als'))
  ) {
    return category === 'mci'
      ? 'Size-Up: Additional resources (MCI often needs more units).'
      : 'Size-Up: Additional resources if needed.';
  }
  if (!done.has('c_spine') && (category === 'trauma' || category === 'mci')) {
    return 'Size-Up: Consider C-spine if the mechanism warrants it.';
  }
  return 'Size-up looks solid — use the bottom button for patient contact when ready.';
}

export function recommendedRootForStage(stageId: NremtStage): ActionMenuRoot {
  switch (stageId) {
    case 'scene_sizeup':
      return 'scene';
    case 'primary_survey':
    case 'history':
    case 'secondary':
    case 'vitals':
    case 'reassessment':
      return 'assessment';
    case 'report':
      return 'transport';
  }
}

export function rootRoleBlurb(root: ActionMenuRoot, stageId: NremtStage): string {
  const focus = recommendedRootForStage(stageId);
  if (root === focus) {
    switch (root) {
      case 'scene':
        return 'Suggested now · size-up';
      case 'assessment':
        return stageId === 'primary_survey'
          ? 'Suggested now · primary / ABCs'
          : stageId === 'history'
            ? 'Suggested now · history'
            : stageId === 'vitals'
              ? 'Suggested now · vitals'
              : 'Suggested now · assessment';
      case 'transport':
        return 'Suggested now · report';
      default:
        return 'Suggested now';
    }
  }
  if (root === 'interventions') {
    return stageId === 'primary_survey' || stageId === 'vitals'
      ? 'Treat life threats here'
      : 'Interventions & meds';
  }
  if (root === 'resources') return 'ALS · Law · Fire';
  if (root === 'scene') return 'Safety & size-up';
  if (root === 'assessment') return 'Exam · history · vitals';
  if (root === 'transport') return 'Stay · load · destination';
  return '';
}
