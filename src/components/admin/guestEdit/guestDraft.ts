import type { GuestUpdateInput } from '../../../lib/adminGuests';
import { clampDietCounts, specialMealTotal, type DietCounts } from '../../../lib/dietCounts';
import { toWhatsAppNumber } from '../../../lib/guestInvites';
import {
  isGuestStatus,
  MAX_DIETARY_NOTES_LENGTH,
  MAX_PARTY_COUNT,
  type Guest,
  type GuestStatus,
} from '../../../types/guest';

export { MAX_PARTY_COUNT };
export const NEW_GROUP_VALUE = '__new_group__';

export type GuestDraft = {
  name: string;
  phone: string;
  groupAffiliation: string;
  creatingNewGroup: boolean;
  newGroupName: string;
  status: GuestStatus;
  guestsCount: number;
  vegetarianCount: number;
  veganCount: number;
  glutenFreeCount: number;
  kidsMealCount: number;
  otherDietaryNotes: string;
};

function dietFromDraft(draft: Pick<GuestDraft, keyof DietCounts>): DietCounts {
  return {
    vegetarianCount: draft.vegetarianCount,
    veganCount: draft.veganCount,
    glutenFreeCount: draft.glutenFreeCount,
    kidsMealCount: draft.kidsMealCount,
  };
}

export function guestToDraft(guest: Guest): GuestDraft {
  const diets = clampDietCounts(
    {
      vegetarianCount: guest.vegetarian_count,
      veganCount: guest.vegan_count,
      glutenFreeCount: guest.gluten_free_count,
      kidsMealCount: guest.kids_meal_count,
    },
    guest.guests_count,
  );

  return {
    name: guest.name,
    phone: guest.phone ?? '',
    groupAffiliation: guest.group_affiliation ?? '',
    creatingNewGroup: false,
    newGroupName: '',
    status: guest.status,
    guestsCount: guest.guests_count,
    vegetarianCount: diets.vegetarianCount,
    veganCount: diets.veganCount,
    glutenFreeCount: diets.glutenFreeCount,
    kidsMealCount: diets.kidsMealCount,
    otherDietaryNotes: (guest.other_dietary_notes ?? '').slice(0, MAX_DIETARY_NOTES_LENGTH),
  };
}

export function guestDraftsEqual(left: GuestDraft, right: GuestDraft): boolean {
  return (
    left.name === right.name &&
    left.phone === right.phone &&
    left.groupAffiliation === right.groupAffiliation &&
    left.creatingNewGroup === right.creatingNewGroup &&
    left.newGroupName === right.newGroupName &&
    left.status === right.status &&
    left.guestsCount === right.guestsCount &&
    left.vegetarianCount === right.vegetarianCount &&
    left.veganCount === right.veganCount &&
    left.glutenFreeCount === right.glutenFreeCount &&
    left.kidsMealCount === right.kidsMealCount &&
    left.otherDietaryNotes === right.otherDietaryNotes
  );
}

export function parseCount(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function resolvedGroupAffiliation(draft: GuestDraft): string | null {
  const raw = draft.creatingNewGroup ? draft.newGroupName : draft.groupAffiliation;
  const trimmed = raw.trim();
  return trimmed || null;
}

export type GuestDraftValidation = { ok: true; input: GuestUpdateInput } | { ok: false; error: string };

function isCountInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function applyDietCounts(draft: GuestDraft, diets: DietCounts, guestsCount = draft.guestsCount): GuestDraft {
  const next = clampDietCounts(diets, guestsCount);
  return {
    ...draft,
    guestsCount,
    vegetarianCount: next.vegetarianCount,
    veganCount: next.veganCount,
    glutenFreeCount: next.glutenFreeCount,
    kidsMealCount: next.kidsMealCount,
  };
}

export function validateGuestDraft(draft: GuestDraft): GuestDraftValidation {
  const trimmedName = draft.name.trim();
  const trimmedPhone = draft.phone.trim();

  if (!trimmedName) {
    return { ok: false, error: 'יש להזין שם.' };
  }
  if (trimmedPhone && !toWhatsAppNumber(trimmedPhone)) {
    return { ok: false, error: 'מספר הטלפון אינו תקין.' };
  }
  if (draft.creatingNewGroup && !draft.newGroupName.trim()) {
    return { ok: false, error: 'יש להזין שם לקבוצה החדשה.' };
  }
  if (!isGuestStatus(draft.status)) {
    return { ok: false, error: 'סטטוס האישור אינו תקין.' };
  }

  const groupAffiliation = resolvedGroupAffiliation(draft);

  let guestsCount = draft.guestsCount;
  let diets = dietFromDraft(draft);
  let otherDietaryNotes = draft.otherDietaryNotes.trim().slice(0, MAX_DIETARY_NOTES_LENGTH) || null;

  if (draft.status === 'declined') {
    guestsCount = 0;
    diets = clampDietCounts(diets, 0);
    otherDietaryNotes = null;
  } else if (draft.status === 'attending') {
    if (!isCountInRange(guestsCount, 1, MAX_PARTY_COUNT)) {
      return { ok: false, error: 'יש לבחור בין 1 ל-50 אורחים.' };
    }
    diets = clampDietCounts(diets, guestsCount);
    if (specialMealTotal(diets) > guestsCount) {
      return { ok: false, error: 'סך המנות המיוחדות לא יכול לעלות על מספר האורחים.' };
    }
  } else if (!isCountInRange(guestsCount, 0, MAX_PARTY_COUNT)) {
    return { ok: false, error: 'מספר האורחים חייב להיות בין 0 ל-50.' };
  } else {
    diets = clampDietCounts(diets, guestsCount);
  }

  return {
    ok: true,
    input: {
      name: trimmedName,
      phone: trimmedPhone || null,
      groupAffiliation,
      status: draft.status,
      guestsCount,
      vegetarianCount: diets.vegetarianCount,
      veganCount: diets.veganCount,
      glutenFreeCount: diets.glutenFreeCount,
      kidsMealCount: diets.kidsMealCount,
      otherDietaryNotes,
    },
  };
}
