import { MAX_PARTY_COUNT } from '../types/guest';

export type DietCounts = {
  vegetarianCount: number;
  veganCount: number;
  glutenFreeCount: number;
  kidsMealCount: number;
};

export const EMPTY_DIET_COUNTS: DietCounts = {
  vegetarianCount: 0,
  veganCount: 0,
  glutenFreeCount: 0,
  kidsMealCount: 0,
};

const TRIM_ORDER: (keyof DietCounts)[] = [
  'kidsMealCount',
  'glutenFreeCount',
  'veganCount',
  'vegetarianCount',
];

export function specialMealTotal(counts: DietCounts): number {
  return (
    counts.vegetarianCount + counts.veganCount + counts.glutenFreeCount + counts.kidsMealCount
  );
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_PARTY_COUNT, Math.trunc(value)));
}

export function clampDietCounts(counts: DietCounts, guestsCount: number): DietCounts {
  const max = Math.max(0, Math.min(MAX_PARTY_COUNT, Math.trunc(guestsCount)));
  const next: DietCounts = {
    vegetarianCount: normalizeCount(counts.vegetarianCount),
    veganCount: normalizeCount(counts.veganCount),
    glutenFreeCount: normalizeCount(counts.glutenFreeCount),
    kidsMealCount: normalizeCount(counts.kidsMealCount),
  };

  let overflow = specialMealTotal(next) - max;
  for (const key of TRIM_ORDER) {
    if (overflow <= 0) break;
    const reduce = Math.min(next[key], overflow);
    next[key] -= reduce;
    overflow -= reduce;
  }

  return next;
}

export function remainingSpecialMeals(counts: DietCounts, guestsCount: number): number {
  return Math.max(0, guestsCount - specialMealTotal(counts));
}
