import type { GuestRsvp, GuestStatus } from '../types/guest';
import { supabase } from './supabaseClient';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isGuestId(value: string): boolean {
  return UUID_RE.test(value);
}

function isGuestStatus(value: unknown): value is GuestStatus {
  return value === 'pending' || value === 'attending' || value === 'declined';
}

function parseGuestRsvp(data: unknown): GuestRsvp | null {
  if (!data || typeof data !== 'object') return null;

  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
  if (!isGuestStatus(row.status)) return null;
  if (typeof row.guests_count !== 'number' || typeof row.children_count !== 'number') return null;
  if (
    typeof row.is_vegetarian !== 'boolean' ||
    typeof row.is_vegan !== 'boolean' ||
    typeof row.is_gluten_free !== 'boolean'
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    guests_count: row.guests_count,
    children_count: row.children_count,
    is_vegetarian: row.is_vegetarian,
    is_vegan: row.is_vegan,
    is_gluten_free: row.is_gluten_free,
    other_dietary_notes: typeof row.other_dietary_notes === 'string' ? row.other_dietary_notes : null,
  };
}

export async function fetchGuestRsvp(guestId: string): Promise<GuestRsvp | null> {
  if (!isGuestId(guestId)) return null;

  const { data, error } = await supabase.rpc('get_guest', { guest_id: guestId });
  if (error) throw error;
  return parseGuestRsvp(data);
}

export async function submitGuestRsvp(input: {
  guestId: string;
  status: Extract<GuestStatus, 'attending' | 'declined'>;
  guestsCount: number;
  childrenCount: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  otherDietaryNotes: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('submit_rsvp', {
    guest_id: input.guestId,
    status: input.status,
    guests_count: input.guestsCount,
    children_count: input.childrenCount,
    is_vegetarian: input.isVegetarian,
    is_vegan: input.isVegan,
    is_gluten_free: input.isGlutenFree,
    other_dietary_notes: input.otherDietaryNotes,
  });

  if (error) throw error;
}
