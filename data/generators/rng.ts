export type Rng = () => number;

export function createRng(seed?: number): Rng {
  if (seed === undefined) return Math.random;

  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function pickRandom<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<T extends { weight: number }>(items: T[], rng: Rng): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function randomInt(min: number, max: number, rng: Rng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, rng: Rng): number {
  return Math.round((rng() * (max - min) + min) * 10) / 10;
}

export function pickFromPool(pool: number[], rng: Rng): number {
  return pickRandom(pool, rng);
}

export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(values[key] ?? '')
  );
}

export function generateId(prefix: string, rng: Rng): string {
  const suffix = Math.floor(rng() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${prefix}_${Date.now().toString(36)}_${suffix}`;
}

export function pickDifficulty(rng: Rng): 'easy' | 'medium' | 'hard' {
  const roll = rng();
  if (roll < 0.45) return 'easy';
  if (roll < 0.8) return 'medium';
  return 'hard';
}

/** Pick up to `count` unique items from a pool. */
export function randomSubset<T>(items: T[], count: number, rng: Rng): T[] {
  if (items.length === 0 || count <= 0) return [];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
