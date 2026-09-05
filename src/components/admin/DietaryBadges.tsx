import type { Guest } from '../../types/guest';
import { DIET_LABELS } from './guestDiet';

function getDietLabels(guest: Pick<Guest, 'is_vegetarian' | 'is_vegan' | 'is_gluten_free'>): string[] {
  const labels: string[] = [];
  if (guest.is_vegetarian) labels.push(DIET_LABELS.vegetarian);
  if (guest.is_vegan) labels.push(DIET_LABELS.vegan);
  if (guest.is_gluten_free) labels.push(DIET_LABELS.glutenFree);
  return labels;
}

export default function DietaryBadges({ guest }: { guest: Guest }) {
  const labels = getDietLabels(guest);

  if (labels.length === 0 && !guest.other_dietary_notes) {
    return <span className="text-sm text-[#9AA6B8]">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-flex whitespace-nowrap rounded-md border border-[#C5A059]/80 bg-[#C5A059] px-2 py-0.5 text-xs font-medium text-white"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {guest.other_dietary_notes ? (
        <p className="max-w-[16rem] text-xs leading-relaxed text-[#6F7C91]">{guest.other_dietary_notes}</p>
      ) : null}
    </div>
  );
}
