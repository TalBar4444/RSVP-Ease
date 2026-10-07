import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clampDietCounts, EMPTY_DIET_COUNTS, remainingSpecialMeals, type DietCounts } from '../../lib/dietCounts';
import { fetchGuestRsvp, recordGuestLinkOpen, submitGuestRsvp } from '../../lib/guestRsvp';
import { wedding } from '../../theme/wedding';
import { MAX_DIETARY_NOTES_LENGTH, MAX_PARTY_COUNT, type GuestRsvp, type GuestStatus } from '../../types/guest';
import { DIET_LABELS } from '../admin/guestDiet';
import ChoiceButton from './ChoiceButton';
import GuestShell from './GuestShell';
import { IconCheck, IconFamily, IconPlane, IconQuestion, IconWheat } from './icons';
import Stepper from './Stepper';
import ThankYouDetails from './ThankYouDetails';
import WeddingHeader from './WeddingHeader';

const previewGuest: GuestRsvp = {
  id: 'preview',
  name: 'אורח לדוגמה',
  status: 'attending',
  guests_count: 2,
  vegetarian_count: 1,
  vegan_count: 0,
  gluten_free_count: 0,
  kids_meal_count: 0,
  other_dietary_notes: null,
};

function dietsFromGuest(guest: GuestRsvp): DietCounts {
  return clampDietCounts(
    {
      vegetarianCount: guest.vegetarian_count,
      veganCount: guest.vegan_count,
      glutenFreeCount: guest.gluten_free_count,
      kidsMealCount: guest.kids_meal_count,
    },
    guest.guests_count,
  );
}

function DietQuantityOption({
  label,
  count,
  remaining,
  onChange,
}: {
  label: string;
  count: number;
  remaining: number;
  onChange: (next: number) => void;
}) {
  const max = count + remaining;
  const selected = count > 0;

  return (
    <div
      className={`flex min-h-11 items-center justify-between gap-0.5 rounded-lg px-1 ${
        selected
          ? 'border border-[#C5A059] bg-[#C5A059] text-white shadow-[0_5px_14px_rgba(197,160,89,0.18)]'
          : 'border border-[#C5A059]/80 bg-[#FBF8F2]/80 text-[#082D58]'
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => {
          if (count > 0) onChange(0);
          else if (remaining > 0) onChange(1);
        }}
        className="flex min-w-0 flex-1 items-center justify-center gap-0.5 py-2 text-[1.05rem] font-normal"
      >
        {selected ? <IconCheck className="h-4 w-4 shrink-0 text-white" /> : null}
        <span className="whitespace-nowrap">{label}</span>
      </button>
      <Stepper
        compact
        inverted={selected}
        value={count}
        min={0}
        max={max}
        onDecrease={() => onChange(Math.max(0, count - 1))}
        onIncrease={() => onChange(Math.min(max, count + 1))}
        decreaseLabel={`הפחתת ${label}`}
        increaseLabel={`הוספת ${label}`}
      />
    </div>
  );
}

export default function GuestRsvpForm() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState<GuestRsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const guestIdRef = useRef(guestId);
  const submitIdRef = useRef(0);

  const [status, setStatus] = useState<GuestStatus>('pending');
  const [guestsCount, setGuestsCount] = useState(1);
  const [dietCounts, setDietCounts] = useState<DietCounts>(EMPTY_DIET_COUNTS);
  const [otherDietary, setOtherDietary] = useState('');
  const [showOtherText, setShowOtherText] = useState(false);

  useEffect(() => {
    let cancelled = false;
    guestIdRef.current = guestId;
    submitIdRef.current += 1;

    async function fetchGuest() {
      setLoading(true);
      setError(null);
      setSubmitError(null);
      setSuccess(false);
      setEditing(false);
      setGuest(null);

      try {
        if (import.meta.env.DEV && guestId === 'preview') {
          if (cancelled) return;
          setGuest(previewGuest);
          setStatus(previewGuest.status);
          setGuestsCount(previewGuest.guests_count);
          setDietCounts(dietsFromGuest(previewGuest));
          setOtherDietary('');
          setShowOtherText(false);
          setLoading(false);
          return;
        }

        if (!guestId) {
          if (cancelled) return;
          setError('נא להיכנס דרך הקישור האישי שקיבלת בוואטסאפ.');
          setLoading(false);
          return;
        }

        const fetchedGuest = await fetchGuestRsvp(guestId);
        if (cancelled) return;

        if (fetchedGuest) {
          setGuest(fetchedGuest);
          setStatus(fetchedGuest.status);
          setGuestsCount(fetchedGuest.guests_count || 1);
          setDietCounts(dietsFromGuest(fetchedGuest));
          setOtherDietary((fetchedGuest.other_dietary_notes || '').slice(0, MAX_DIETARY_NOTES_LENGTH));
          setShowOtherText(Boolean(fetchedGuest.other_dietary_notes));
          if (document.visibilityState === 'visible') {
            void recordGuestLinkOpen(fetchedGuest.id);
          }
        } else {
          setError('אורח לא נמצא במערכת.');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('אירעה שגיאה בטעינת הנתונים.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchGuest();
    return () => {
      cancelled = true;
      guestIdRef.current = undefined;
      submitIdRef.current += 1;
    };
  }, [guestId]);

  const attendingDiets = status === 'attending' ? clampDietCounts(dietCounts, guestsCount) : EMPTY_DIET_COUNTS;
  const remainingMeals = remainingSpecialMeals(attendingDiets, guestsCount);

  const applyPartySize = (nextCount: number) => {
    const next = Math.min(MAX_PARTY_COUNT, Math.max(1, nextCount));
    setGuestsCount(next);
    setDietCounts((current) => clampDietCounts(current, next));
  };

  const applyDietCount = (field: keyof DietCounts, nextValue: number) => {
    setDietCounts((current) => {
      const remaining = remainingSpecialMeals(current, guestsCount);
      const max = current[field] + remaining;
      return { ...current, [field]: Math.min(max, Math.max(0, nextValue)) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;
    if (status !== 'attending' && status !== 'declined') return;

    const isAttending = status === 'attending';
    const nextGuests = isAttending ? guestsCount : 0;
    const nextDiets = isAttending ? clampDietCounts(dietCounts, guestsCount) : EMPTY_DIET_COUNTS;
    const nextNotes =
      isAttending && showOtherText ? otherDietary.trim().slice(0, MAX_DIETARY_NOTES_LENGTH) || null : null;

    if (import.meta.env.DEV && guest.id === previewGuest.id) {
      setGuest({
        ...guest,
        status,
        guests_count: nextGuests,
        vegetarian_count: nextDiets.vegetarianCount,
        vegan_count: nextDiets.veganCount,
        gluten_free_count: nextDiets.glutenFreeCount,
        kids_meal_count: nextDiets.kidsMealCount,
        other_dietary_notes: nextNotes,
      });
      setEditing(false);
      setSuccess(true);
      return;
    }

    const submittedGuestId = guest.id;
    const submitId = ++submitIdRef.current;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitGuestRsvp({
        guestId: submittedGuestId,
        status,
        guestsCount: nextGuests,
        vegetarianCount: nextDiets.vegetarianCount,
        veganCount: nextDiets.veganCount,
        glutenFreeCount: nextDiets.glutenFreeCount,
        kidsMealCount: nextDiets.kidsMealCount,
        otherDietaryNotes: nextNotes,
      });
      if (submitId !== submitIdRef.current || guestIdRef.current !== submittedGuestId) return;
      setGuest({
        ...guest,
        status,
        guests_count: nextGuests,
        vegetarian_count: nextDiets.vegetarianCount,
        vegan_count: nextDiets.veganCount,
        gluten_free_count: nextDiets.glutenFreeCount,
        kids_meal_count: nextDiets.kidsMealCount,
        other_dietary_notes: nextNotes,
      });
      setEditing(false);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (submitId !== submitIdRef.current || guestIdRef.current !== submittedGuestId) return;
      setSubmitError('אירעה שגיאה בעדכון התשובה. נא לנסות שוב.');
    } finally {
      if (submitId === submitIdRef.current) setSubmitting(false);
    }
  };

  const handleChangeResponse = () => {
    setSuccess(false);
    setSubmitError(null);
    setEditing(true);
  };

  if (loading) {
    return (
      <GuestShell>
        <WeddingHeader subtitle="נשמח לעדכון קצר לגבי הגעתכם" />
        <p className="text-center text-[#6B778C] animate-pulse">טוען את פרטי ההזמנה שלך...</p>
      </GuestShell>
    );
  }

  if (error) {
    return (
      <GuestShell>
        <WeddingHeader />
        <p className="text-center font-medium leading-relaxed text-rose-700">{error}</p>
      </GuestShell>
    );
  }

  const alreadyResponded = guest !== null && (guest.status === 'attending' || guest.status === 'declined');
  const showThankYou = guest !== null && (success || (alreadyResponded && !editing));

  if (showThankYou && guest && (status === 'attending' || status === 'declined')) {
    const isAttending = status === 'attending';
    return (
      <GuestShell>
        <WeddingHeader />
        <div className="text-center">
          <h2 className="mb-2 font-display text-2xl font-semibold">תודה רבה</h2>
          <p className="leading-relaxed text-[#6B778C]">
            {success ? 'התשובה שלך נשמרה במערכת ועודכנה בהצלחה.' : 'כבר עדכנתם את פרטי ההגעה.'}
          </p>
          <p className="mt-3 font-medium" style={{ color: isAttending ? wedding.gold : wedding.muted }}>
            {isAttending ? 'נתראה בשמחה שלנו' : 'תחסרו לנו, תודה שעדכנתם.'}
          </p>
        </div>
        <ThankYouDetails
          name={guest.name}
          status={status}
          guestsCount={isAttending ? guestsCount : 0}
          vegetarianCount={attendingDiets.vegetarianCount}
          veganCount={attendingDiets.veganCount}
          glutenFreeCount={attendingDiets.glutenFreeCount}
          kidsMealCount={attendingDiets.kidsMealCount}
          otherDietary={isAttending && showOtherText ? otherDietary : ''}
        />
        <button
          type="button"
          onClick={handleChangeResponse}
          className="relative mt-[1.45rem] flex min-h-[3.9rem] w-full items-center justify-center rounded-lg bg-[#082D58] text-[1.15rem] font-medium text-white shadow-[0_7px_18px_rgba(8,45,88,0.13)] transition-all active:scale-[0.99]"
        >
          לעדכון הגעה
          <span className="absolute left-5 top-1/2 -translate-y-1/2" aria-hidden="true">
            <IconPlane />
          </span>
        </button>
      </GuestShell>
    );
  }

  return (
    <GuestShell>
      <WeddingHeader subtitle="נשמח לעדכון קצר לגבי הגעתכם" />

      <form onSubmit={handleSubmit}>
        <section className="pb-[1.4rem]">
          <div className="mb-[1.05rem] flex items-center gap-3">
            <IconQuestion />
            <h2 className="text-[1.08rem] font-medium">האם תגיעו לחגוג איתנו?</h2>
          </div>
          <div className="grid grid-cols-2 gap-[1.15rem]" role="radiogroup" aria-label="האם תגיעו לחגוג איתנו?">
            <ChoiceButton selected={status === 'attending'} onClick={() => setStatus('attending')} className="min-h-[3.2rem]">
              בטח שמגיעים
            </ChoiceButton>
            <ChoiceButton selected={status === 'declined'} onClick={() => setStatus('declined')} className="min-h-[3.2rem]">
              לא אוכל להגיע
            </ChoiceButton>
          </div>
        </section>

        {status === 'attending' && (
          <div className="guest-details">
            <section className="border-t border-[#E6DCCB] pt-[1.35rem]">
              <div className="mb-[0.95rem] flex items-center gap-3">
                <IconWheat />
                <h2 className="text-[1.05rem] font-medium">העדפות קולינריות מיוחדות?</h2>
              </div>

              <div className="mb-[0.35rem] flex min-h-[6.1rem] items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconFamily />
                  <p className="text-[1.05rem] font-medium">כמה תגיעו?</p>
                </div>
                <Stepper
                  value={guestsCount}
                  min={1}
                  max={MAX_PARTY_COUNT}
                  onDecrease={() => applyPartySize(guestsCount - 1)}
                  onIncrease={() => applyPartySize(guestsCount + 1)}
                  decreaseLabel="הפחתת אורחים"
                  increaseLabel="הוספת אורחים"
                />
              </div>

              <div className="grid grid-cols-2 gap-[0.9rem]">
                <DietQuantityOption
                  label={DIET_LABELS.vegetarian}
                  count={attendingDiets.vegetarianCount}
                  remaining={remainingMeals}
                  onChange={(next) => applyDietCount('vegetarianCount', next)}
                />
                <DietQuantityOption
                  label={DIET_LABELS.vegan}
                  count={attendingDiets.veganCount}
                  remaining={remainingMeals}
                  onChange={(next) => applyDietCount('veganCount', next)}
                />
                <DietQuantityOption
                  label={DIET_LABELS.glutenFree}
                  count={attendingDiets.glutenFreeCount}
                  remaining={remainingMeals}
                  onChange={(next) => applyDietCount('glutenFreeCount', next)}
                />
                <DietQuantityOption
                  label={DIET_LABELS.kidsMeal}
                  count={attendingDiets.kidsMealCount}
                  remaining={remainingMeals}
                  onChange={(next) => applyDietCount('kidsMealCount', next)}
                />
              </div>

              <label className="mt-[2.15rem] flex min-h-[3.55rem] cursor-pointer items-center gap-3 rounded-lg border border-[#D8C8AA] bg-white/25 px-4">
                <input
                  type="checkbox"
                  checked={showOtherText}
                  onChange={(e) => setShowOtherText(e.target.checked)}
                  className="h-[1.35rem] w-[1.35rem] appearance-none rounded-[2px] border border-[#66758B] bg-[#FBF8F2] checked:border-[#C5A059] checked:bg-[#C5A059]"
                />
                <span className="text-[1.02rem] text-[#082D58]">יש רגישויות או משהו אחר?</span>
              </label>

              <div className="mt-2 h-[5.35rem]">
                {showOtherText ? (
                  <>
                    <textarea
                      id="other-dietary"
                      value={otherDietary}
                      onChange={(e) => setOtherDietary(e.target.value.slice(0, MAX_DIETARY_NOTES_LENGTH))}
                      maxLength={MAX_DIETARY_NOTES_LENGTH}
                      aria-label="פירוט אלרגיות או בקשות מיוחדות"
                      placeholder="פירוט אלרגיות או בקשות מיוחדות..."
                      rows={2}
                      className="h-[4.1rem] w-full resize-none rounded-lg border border-[#C5A059] bg-white/75 p-3 text-base text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20"
                    />
                    <p className="mt-1 h-4 text-left text-xs leading-4 text-[#9AA6B8]" dir="ltr">
                      {otherDietary.length}/{MAX_DIETARY_NOTES_LENGTH}
                    </p>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        )}

        {submitError ? <p className="mt-3 text-center text-sm text-rose-700">{submitError}</p> : null}

        <button
          type="submit"
          disabled={submitting || status === 'pending'}
          className="relative mt-[1.45rem] flex min-h-[3.9rem] w-full items-center justify-center rounded-lg bg-[#082D58] text-[1.15rem] font-medium text-white shadow-[0_7px_18px_rgba(8,45,88,0.13)] transition-all active:scale-[0.99] disabled:bg-[#D9CDB8] disabled:text-[#8A93A6] disabled:shadow-none"
        >
          {submitting ? 'שומר תשובה...' : 'שליחת עדכון'}
          {!(submitting || status === 'pending') ? (
            <span className="absolute left-5 top-1/2 -translate-y-1/2" aria-hidden="true">
              <IconPlane />
            </span>
          ) : null}
        </button>
      </form>
    </GuestShell>
  );
}
