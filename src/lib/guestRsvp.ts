import { isGuestStatus, type GuestRsvp, type GuestStatus } from '../types/guest';
import { supabase } from './supabaseClient';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isGuestId(value: string): boolean {
  return UUID_RE.test(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseGuestRsvp(data: unknown): GuestRsvp | null {
  if (!data || typeof data !== 'object') return null;

  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
  if (!isGuestStatus(row.status)) return null;
  if (
    !isCount(row.guests_count) ||
    !isCount(row.vegetarian_count) ||
    !isCount(row.vegan_count) ||
    !isCount(row.gluten_free_count) ||
    !isCount(row.kids_meal_count)
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    guests_count: row.guests_count,
    vegetarian_count: row.vegetarian_count,
    vegan_count: row.vegan_count,
    gluten_free_count: row.gluten_free_count,
    kids_meal_count: row.kids_meal_count,
    other_dietary_notes: typeof row.other_dietary_notes === 'string' ? row.other_dietary_notes : null,
  };
}

export async function fetchGuestRsvp(guestId: string): Promise<GuestRsvp | null> {
  if (!isGuestId(guestId)) return null;

  const { data, error } = await supabase.rpc('get_guest', { guest_id: guestId });
  if (error) throw error;
  return parseGuestRsvp(data);
}

export async function recordGuestLinkOpen(guestId: string): Promise<void> {
  if (!isGuestId(guestId)) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

  const { error } = await supabase.rpc('record_link_open', { guest_id: guestId });
  if (error) {
    console.error(error);
  }
}

export async function submitGuestRsvp(input: {
  guestId: string;
  status: Extract<GuestStatus, 'attending' | 'declined'>;
  guestsCount: number;
  vegetarianCount: number;
  veganCount: number;
  glutenFreeCount: number;
  kidsMealCount: number;
  otherDietaryNotes: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('submit_rsvp', {
    guest_id: input.guestId,
    status: input.status,
    guests_count: input.guestsCount,
    vegetarian_count: input.vegetarianCount,
    vegan_count: input.veganCount,
    gluten_free_count: input.glutenFreeCount,
    kids_meal_count: input.kidsMealCount,
    other_dietary_notes: input.otherDietaryNotes,
  });

  if (error) throw error;
}
