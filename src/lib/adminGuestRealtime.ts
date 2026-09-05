import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Guest } from '../types/guest';
import { parseGuest } from './adminGuests';

export type GuestRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

export function sortGuests(guests: Guest[]): Guest[] {
  return [...guests].sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

export function upsertGuestInList(guests: Guest[], guest: Guest): Guest[] {
  const index = guests.findIndex((item) => item.id === guest.id);
  if (index === -1) return sortGuests([...guests, guest]);
  const next = guests.slice();
  next[index] = guest;
  return sortGuests(next);
}

export function removeGuestFromList(guests: Guest[], guestId: string): Guest[] {
  return guests.filter((guest) => guest.id !== guestId);
}

export function applyGuestRealtimeEvent(guests: Guest[], payload: GuestRealtimePayload): Guest[] {
  if (payload.eventType === 'DELETE') {
    const id = payload.old.id;
    if (typeof id !== 'string') return guests;
    return removeGuestFromList(guests, id);
  }

  const parsed = parseGuest(payload.new);
  if (!parsed) return guests;
  return upsertGuestInList(guests, parsed);
}

export function replayGuestRealtimeEvents(
  guests: Guest[],
  events: readonly GuestRealtimePayload[],
): Guest[] {
  let next = guests;
  for (const event of events) {
    next = applyGuestRealtimeEvent(next, event);
  }
  return next;
}
