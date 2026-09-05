export const MAX_DIETARY_NOTES_LENGTH = 100;

export type GuestStatus = 'pending' | 'attending' | 'declined';

export function isGuestStatus(value: unknown): value is GuestStatus {
  return value === 'pending' || value === 'attending' || value === 'declined';
}

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  /** Admin-only label (e.g. family side, friend group). Not shown to guests. */
  group_affiliation: string | null;
  status: GuestStatus;
  guests_count: number;
  children_count: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  other_dietary_notes: string | null;
}

/** Public RSVP payload: no phone or group affiliation. */
export type GuestRsvp = Omit<Guest, 'phone' | 'group_affiliation'>;

export interface GuestKpiMetrics {
  totalConfirmed: number;
  totalAdults: number;
  totalChildren: number;
  pendingInvitations: number;
  vegetarianCount: number;
  veganCount: number;
  glutenFreeCount: number;
}
