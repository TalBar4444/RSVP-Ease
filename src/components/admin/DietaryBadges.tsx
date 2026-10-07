import type { Guest } from '../../types/guest';
import { guestDietBadges } from './guestDiet';

export default function DietaryBadges({
  guest,
  align = 'center',
}: {
  guest: Guest;
  align?: 'center' | 'start';
}) {
  const labels = guestDietBadges(guest);
  const isStart = align === 'start';

  if (labels.length === 0 && !guest.other_dietary_notes) {
    return <span className="text-sm text-[#9AA6B8]">—</span>;
  }

  return (
    <div className={`flex flex-col gap-1 ${isStart ? 'items-start' : 'items-center'}`}>
      {labels.length > 0 ? (
        <div className={`flex flex-wrap gap-1 ${isStart ? 'justify-start' : 'justify-center'}`}>
          {labels.map((item) => (
            <span
              key={item.key}
              className="inline-flex whitespace-nowrap rounded-md border border-[#C5A059]/80 bg-[#C5A059] px-2 py-0.5 text-xs font-medium text-white"
            >
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      {guest.other_dietary_notes ? (
        <p
          className={`max-w-[16rem] text-xs leading-relaxed text-[#6F7C91] ${
            isStart ? 'text-start' : 'text-center'
          }`}
        >
          {guest.other_dietary_notes}
        </p>
      ) : null}
    </div>
  );
}
