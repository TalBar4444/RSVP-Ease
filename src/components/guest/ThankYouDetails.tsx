import { wedding } from '../../theme/wedding';
import type { GuestStatus } from '../../types/guest';

const DIET_LABELS = {
  vegetarian: 'צמחוני',
  vegan: 'טבעוני',
  glutenFree: 'ללא גלוטן',
} as const;

function DetailRow({
  label,
  value,
  valueClassName = 'text-[#082D58]',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-[2.75rem] items-center justify-between gap-4 border-t border-[#E6DCCB] text-[1.02rem]">
      <span className="font-medium">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export default function ThankYouDetails({
  name,
  status,
  guestsCount,
  childrenCount,
  isVegetarian,
  isVegan,
  isGlutenFree,
  otherDietary,
}: {
  name: string;
  status: GuestStatus;
  guestsCount: number;
  childrenCount: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  otherDietary: string;
}) {
  const isAttending = status === 'attending';
  const dietLabels = [
    isAttending && isVegetarian ? DIET_LABELS.vegetarian : null,
    isAttending && isVegan ? DIET_LABELS.vegan : null,
    isAttending && isGlutenFree ? DIET_LABELS.glutenFree : null,
  ].filter((label) => label !== null);
  const notes = isAttending ? otherDietary.trim() : '';

  return (
    <section className="mt-6 rounded-xl border border-[#E6DCCB] bg-white/40 px-4 py-4 text-right" aria-label="פרטי ההזמנה">
      <h3 className="mb-1 text-center text-[0.95rem] font-medium text-[#6B778C]">פרטי ההזמנה</h3>
      <p className="mb-3 text-center font-display text-xl font-semibold text-[#082D58]">{name}</p>

      <DetailRow
        label="הגעה"
        value={isAttending ? 'מגיעים' : 'לא מגיעים'}
        valueClassName={
          isAttending
            ? 'inline-flex rounded-full border border-[#082D58] bg-[#082D58] px-2.5 py-0.5 text-xs font-medium text-white'
            : 'inline-flex rounded-full border border-[#C45C6A]/80 bg-[#F3D5D8] px-2.5 py-0.5 text-xs font-medium text-[#8B3D48]'
        }
      />

      {isAttending ? (
        <>
          <DetailRow label="מבוגרים" value={String(guestsCount)} />
          <DetailRow label="ילדים" value={String(childrenCount)} />
          <DetailRow label="קבלת פנים" value={wedding.receptionTime} />
        </>
      ) : null}

      {dietLabels.length > 0 ? (
        <div className="flex min-h-[2.75rem] items-center justify-between gap-4 border-t border-[#E6DCCB]">
          <span className="text-[1.02rem] font-medium">העדפות קולינריות</span>
          <div className="flex flex-wrap justify-end gap-1">
            {dietLabels.map((label) => (
              <span
                key={label}
                className="inline-flex whitespace-nowrap rounded-md border border-[#C5A059]/80 bg-[#C5A059] px-2 py-0.5 text-xs font-medium text-white"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {notes ? (
        <div className="border-t border-[#E6DCCB] py-3">
          <p className="mb-1 text-[1.02rem] font-medium">הערות</p>
          <p className="text-sm leading-relaxed text-[#6B778C]">{notes}</p>
        </div>
      ) : null}
    </section>
  );
}
