import type { GuestUpdateInput } from '../../../lib/adminGuests';
import { toWhatsAppNumber } from '../../../lib/guestInvites';
import { isGuestStatus, MAX_DIETARY_NOTES_LENGTH, type Guest, type GuestStatus } from '../../../types/guest';

export const MAX_PARTY_COUNT = 50;
export const NEW_GROUP_VALUE = '__new_group__';

export type GuestDraft = {
  name: string;
  phone: string;
  groupAffiliation: string;
  creatingNewGroup: boolean;
  newGroupName: string;
  status: GuestStatus;
  guestsCount: number;
  childrenCount: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  otherDietaryNotes: string;
};

export function guestToDraft(guest: Guest): GuestDraft {
  return {
    name: guest.name,
    phone: guest.phone ?? '',
    groupAffiliation: guest.group_affiliation ?? '',
    creatingNewGroup: false,
    newGroupName: '',
    status: guest.status,
    guestsCount: guest.guests_count,
    childrenCount: guest.children_count,
    isVegetarian: guest.is_vegetarian,
    isVegan: guest.is_vegan,
    isGlutenFree: guest.is_gluten_free,
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
    left.childrenCount === right.childrenCount &&
    left.isVegetarian === right.isVegetarian &&
    left.isVegan === right.isVegan &&
    left.isGlutenFree === right.isGlutenFree &&
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
  let childrenCount = draft.childrenCount;
  let isVegetarian = draft.isVegetarian;
  let isVegan = draft.isVegan;
  let isGlutenFree = draft.isGlutenFree;
  let otherDietaryNotes = draft.otherDietaryNotes.trim().slice(0, MAX_DIETARY_NOTES_LENGTH) || null;

  if (draft.status === 'declined') {
    guestsCount = 0;
    childrenCount = 0;
    isVegetarian = false;
    isVegan = false;
    isGlutenFree = false;
    otherDietaryNotes = null;
  } else if (draft.status === 'attending') {
    if (!isCountInRange(guestsCount, 1, MAX_PARTY_COUNT)) {
      return { ok: false, error: 'יש לבחור בין 1 ל-50 מבוגרים.' };
    }
    if (!isCountInRange(childrenCount, 0, MAX_PARTY_COUNT)) {
      return { ok: false, error: 'מספר הילדים חייב להיות בין 0 ל-50.' };
    }
  } else if (
    !isCountInRange(guestsCount, 0, MAX_PARTY_COUNT) ||
    !isCountInRange(childrenCount, 0, MAX_PARTY_COUNT)
  ) {
    return { ok: false, error: 'מספר האורחים חייב להיות בין 0 ל-50.' };
  }

  return {
    ok: true,
    input: {
      name: trimmedName,
      phone: trimmedPhone || null,
      groupAffiliation,
      status: draft.status,
      guestsCount,
      childrenCount,
      isVegetarian,
      isVegan,
      isGlutenFree,
      otherDietaryNotes,
    },
  };
}
