export const DIET_LABELS = {
  vegetarian: 'צמחוני',
  vegan: 'טבעוני',
  glutenFree: 'ללא גלוטן',
  kidsMeal: 'מנת ילדים',
} as const;

export function formatDietBadge(label: string, count: number): string {
  return `${label} ×${count}`;
}

export function guestDietBadges(guest: {
  vegetarian_count: number;
  vegan_count: number;
  gluten_free_count: number;
  kids_meal_count: number;
}): { key: string; label: string }[] {
  return (
    [
      ['vegetarian', guest.vegetarian_count, DIET_LABELS.vegetarian],
      ['vegan', guest.vegan_count, DIET_LABELS.vegan],
      ['glutenFree', guest.gluten_free_count, DIET_LABELS.glutenFree],
      ['kidsMeal', guest.kids_meal_count, DIET_LABELS.kidsMeal],
    ] as const
  )
    .filter(([, count]) => count > 0)
    .map(([key, count, label]) => ({ key, label: formatDietBadge(label, count) }));
}
