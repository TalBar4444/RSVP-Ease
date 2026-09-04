import { isGuestStatus, type Guest, type GuestStatus } from '../types/guest';
import { supabase } from './supabaseClient';

const GUEST_COLUMNS =
  'id, name, phone, group_affiliation, status, guests_count, children_count, is_vegetarian, is_vegan, is_gluten_free, other_dietary_notes';

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_current_user_admin');
  if (error) throw error;
  return data === true;
}

function parseGuest(data: unknown): Guest | null {
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
    phone: typeof row.phone === 'string' ? row.phone : null,
    group_affiliation: typeof row.group_affiliation === 'string' ? row.group_affiliation : null,
    status: row.status,
    guests_count: row.guests_count,
    children_count: row.children_count,
    is_vegetarian: row.is_vegetarian,
    is_vegan: row.is_vegan,
    is_gluten_free: row.is_gluten_free,
    other_dietary_notes: typeof row.other_dietary_notes === 'string' ? row.other_dietary_notes : null,
  };
}

export async function fetchGuests(): Promise<Guest[]> {
  const { data, error } = await supabase.from('guests').select(GUEST_COLUMNS).order('name');
  if (error) throw error;

  const guests: Guest[] = [];
  for (const row of data ?? []) {
    const parsed = parseGuest(row);
    if (!parsed) throw new Error('Invalid guest row from database.');
    guests.push(parsed);
  }
  return guests;
}

export async function addGuest(input: {
  name: string;
  phone: string | null;
  groupAffiliation: string | null;
}): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      name: input.name,
      phone: input.phone,
      group_affiliation: input.groupAffiliation,
      status: 'pending',
    })
    .select(GUEST_COLUMNS)
    .single();

  if (error) throw error;
  const parsed = parseGuest(data);
  if (!parsed) throw new Error('Invalid guest row from database.');
  return parsed;
}

export type GuestUpdateInput = {
  name: string;
  phone: string | null;
  groupAffiliation: string | null;
  status: GuestStatus;
  guestsCount: number;
  childrenCount: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  otherDietaryNotes: string | null;
};

export async function updateGuest(guestId: string, input: GuestUpdateInput): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .update({
      name: input.name,
      phone: input.phone,
      group_affiliation: input.groupAffiliation,
      status: input.status,
      guests_count: input.guestsCount,
      children_count: input.childrenCount,
      is_vegetarian: input.isVegetarian,
      is_vegan: input.isVegan,
      is_gluten_free: input.isGlutenFree,
      other_dietary_notes: input.otherDietaryNotes,
    })
    .eq('id', guestId)
    .select(GUEST_COLUMNS);

  if (error) throw error;
  if (!data?.length) {
    throw new Error('Update returned 0 rows — this account may not be in admin_users.');
  }

  const parsed = parseGuest(data[0]);
  if (!parsed) throw new Error('Invalid guest row from database.');
  if (parsed.id !== guestId) {
    throw new Error('Update returned a different guest than requested.');
  }
  return parsed;
}

export async function deleteGuest(guestId: string): Promise<void> {
  const { data, error } = await supabase.from('guests').delete().eq('id', guestId).select('id');
  if (error) throw error;
  if (!data?.length) {
    throw new Error('Delete returned 0 rows — this account may not be in admin_users.');
  }
}
