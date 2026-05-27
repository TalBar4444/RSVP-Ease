import type { Guest, GuestKpiMetrics } from '../types/guest';

export function computeGuestKpis(guests: Guest[]): GuestKpiMetrics {
  const attending = guests.filter((g) => g.status === 'attending');

  return {
    totalConfirmed: attending.reduce(
      (sum, g) => sum + g.guests_count + g.children_count,
      0,
    ),
    totalAdults: attending.reduce((sum, g) => sum + g.guests_count, 0),
    totalChildren: attending.reduce((sum, g) => sum + g.children_count, 0),
    pendingInvitations: guests.filter((g) => g.status === 'pending').length,
    vegetarianCount: attending.filter((g) => g.is_vegetarian).length,
    veganCount: attending.filter((g) => g.is_vegan).length,
    glutenFreeCount: attending.filter((g) => g.is_gluten_free).length,
  };
}
