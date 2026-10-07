import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clampDietCounts,
  remainingSpecialMeals,
  specialMealTotal,
  type DietCounts,
} from './dietCounts';

const counts = (
  vegetarianCount: number,
  veganCount: number,
  glutenFreeCount: number,
  kidsMealCount: number,
): DietCounts => ({ vegetarianCount, veganCount, glutenFreeCount, kidsMealCount });

describe('dietCounts', () => {
  it('sums exclusive special meals', () => {
    assert.equal(specialMealTotal(counts(1, 2, 0, 1)), 4);
  });

  it('leaves counts unchanged when they fit the party size', () => {
    assert.deepEqual(clampDietCounts(counts(1, 1, 1, 1), 4), counts(1, 1, 1, 1));
    assert.equal(remainingSpecialMeals(counts(1, 1, 1, 1), 4), 0);
  });

  it('trims overflow from kids meals first, then gluten-free, vegan, vegetarian', () => {
    assert.deepEqual(clampDietCounts(counts(1, 1, 1, 3), 4), counts(1, 1, 1, 1));
    assert.deepEqual(clampDietCounts(counts(1, 1, 2, 0), 2), counts(1, 1, 0, 0));
    assert.deepEqual(clampDietCounts(counts(2, 2, 0, 0), 2), counts(2, 0, 0, 0));
    assert.deepEqual(clampDietCounts(counts(3, 0, 0, 0), 1), counts(1, 0, 0, 0));
  });

  it('zeros all special meals when party size is 0', () => {
    assert.deepEqual(clampDietCounts(counts(1, 1, 1, 1), 0), counts(0, 0, 0, 0));
  });
});
