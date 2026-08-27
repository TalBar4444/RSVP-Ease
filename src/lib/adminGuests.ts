import type { Guest } from '../types/guest';
import { supabase } from './supabaseClient';

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_current_user_admin');
  if (error) throw error;
  return data === true;
}

export async function fetchGuests(): Promise<Guest[]> {
  const { data, error } = await supabase.from('guests').select('*').order('name');
  if (error) throw error;
  return (data as Guest[]) ?? [];
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
    .select('*')
    .single();

  if (error) throw error;
  return data as Guest;
}

export async function updateGuestGroup(guestId: string, groupAffiliation: string | null): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .update({ group_affiliation: groupAffiliation })
    .eq('id', guestId);

  if (error) throw error;
}

export async function deleteGuest(guestId: string): Promise<void> {
  const { data, error } = await supabase.from('guests').delete().eq('id', guestId).select('id');
  if (error) throw error;
  if (!data?.length) {
    throw new Error('Delete returned 0 rows — this account may not be in admin_users.');
  }
}
