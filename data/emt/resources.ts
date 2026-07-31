import type { CallCategory, OnSceneResource, SceneHazard } from '@/data/emt/types';
import type { Rng } from '@/data/generators/rng';

export const ON_SCENE_LABELS: Record<OnSceneResource, string> = {
  fire: 'Fire / Engine company',
  als: 'ALS / Paramedic unit',
  pd: 'Law enforcement',
};

/** Map a request action to the on-scene resource it would summon. */
export const REQUEST_TO_RESOURCE: Partial<Record<string, OnSceneResource>> = {
  request_fire: 'fire',
  request_als: 'als',
  request_pd: 'pd',
};

export function resourceAlreadyOnScene(
  resourcesOnScene: OnSceneResource[],
  actionId: string
): boolean {
  const resource = REQUEST_TO_RESOURCE[actionId];
  return resource ? resourcesOnScene.includes(resource) : false;
}

/**
 * Actions already satisfied by units on scene (e.g. fire present ≈ request_fire done
 * for hazard-clearing purposes).
 */
export function actionsFromOnSceneResources(
  resourcesOnScene: OnSceneResource[]
): string[] {
  const actions: string[] = [];
  if (resourcesOnScene.includes('fire')) actions.push('request_fire');
  if (resourcesOnScene.includes('als')) actions.push('request_als');
  if (resourcesOnScene.includes('pd')) actions.push('request_pd');
  return actions;
}

export function mergeWithOnSceneActions(
  resourcesOnScene: OnSceneResource[],
  taken: string[]
): string[] {
  const fromScene = actionsFromOnSceneResources(resourcesOnScene);
  return [...new Set([...taken, ...fromScene])];
}

/**
 * Roll who beat you to the call. Trauma/hazmat leans fire-first; critical medical
 * sometimes has ALS already with the patient.
 */
export function pickResourcesOnScene(input: {
  category: CallCategory;
  hazards: SceneHazard[];
  recommendsAls: boolean;
  rng: Rng;
}): OnSceneResource[] {
  const { category, hazards, recommendsAls, rng } = input;
  const resources: OnSceneResource[] = [];

  const needsFire = hazards.some((h) => h.clearWith.includes('request_fire'));
  const needsPd = hazards.some((h) => h.clearWith.includes('request_pd'));

  // Fire often first on MVC / smoke / fluid calls — but not always
  if (needsFire) {
    if (rng() < 0.5) resources.push('fire');
  } else if (category === 'trauma' || category === 'mci') {
    if (rng() < 0.3) resources.push('fire');
  }

  if (needsPd && rng() < 0.45) {
    resources.push('pd');
  }

  // ALS already there some of the time on high-acuity medical/trauma
  if (recommendsAls) {
    const alsChance =
      category === 'medical' || category === 'peds' || category === 'ob' ? 0.32 : 0.28;
    if (rng() < alsChance) resources.push('als');
  }

  return resources;
}

export function describeResourcesOnArrival(
  resourcesOnScene: OnSceneResource[]
): { headline: string; lines: string[] } {
  return {
    headline: resourcesOnScene.length === 0 ? 'You are first on scene' : 'Resource status',
    lines: (Object.keys(ON_SCENE_LABELS) as OnSceneResource[]).map(
      (resource) =>
        `${ON_SCENE_LABELS[resource]} — ${
          resourcesOnScene.includes(resource) ? 'ON SCENE' : 'NOT ON SCENE'
        }`
    ),
  };
}
