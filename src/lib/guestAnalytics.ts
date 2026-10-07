import type { Guest, GuestKpiMetrics } from '../types/guest';

export function computeGuestKpis(guests: Guest[]): GuestKpiMetrics {
  const attending = guests.filter((g) => g.status === 'attending');

  return {
    totalConfirmed: attending.reduce((sum, g) => sum + g.guests_count, 0),
    pendingInvitations: guests.filter((g) => g.status === 'pending').length,
    vegetarianCount: attending.reduce((sum, g) => sum + g.vegetarian_count, 0),
    veganCount: attending.reduce((sum, g) => sum + g.vegan_count, 0),
    glutenFreeCount: attending.reduce((sum, g) => sum + g.gluten_free_count, 0),
    kidsMealCount: attending.reduce((sum, g) => sum + g.kids_meal_count, 0),
  };
}
