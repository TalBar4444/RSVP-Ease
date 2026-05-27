export type GuestStatus = 'pending' | 'attending' | 'declined';

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  status: GuestStatus;
  guests_count: number;
  children_count: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  other_dietary_notes: string | null;
}

export interface GuestKpiMetrics {
  totalConfirmed: number;
  totalAdults: number;
  totalChildren: number;
  pendingInvitations: number;
  vegetarianCount: number;
  veganCount: number;
  glutenFreeCount: number;
}
