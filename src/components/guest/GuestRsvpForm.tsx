import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGuestRsvp, submitGuestRsvp } from '../../lib/guestRsvp';
import { wedding } from '../../theme/wedding';
import type { GuestRsvp, GuestStatus } from '../../types/guest';
import ChoiceButton from './ChoiceButton';
import GuestShell from './GuestShell';
import { IconChild, IconPeople, IconPlane, IconQuestion, IconWheat } from './icons';
import Stepper from './Stepper';
import WeddingHeader from './WeddingHeader';

const previewGuest: GuestRsvp = {
  id: 'preview',
  name: 'אורח לדוגמה',
  status: 'attending',
  guests_count: 2,
  children_count: 1,
  is_vegetarian: true,
  is_vegan: false,
  is_gluten_free: false,
  other_dietary_notes: null,
};

export default function GuestRsvpForm() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState<GuestRsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const guestIdRef = useRef(guestId);
  const submitIdRef = useRef(0);

  const [status, setStatus] = useState<GuestStatus>('pending');
  const [guestsCount, setGuestsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
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
      setGuest(null);

      try {
        if (import.meta.env.DEV && guestId === 'preview') {
          if (cancelled) return;
          setGuest(previewGuest);
          setStatus(previewGuest.status);
          setGuestsCount(previewGuest.guests_count);
          setChildrenCount(previewGuest.children_count);
          setIsVegetarian(previewGuest.is_vegetarian);
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
          setChildrenCount(fetchedGuest.children_count || 0);
          setIsVegetarian(fetchedGuest.is_vegetarian);
          setIsVegan(fetchedGuest.is_vegan);
          setIsGlutenFree(fetchedGuest.is_gluten_free);
          setOtherDietary(fetchedGuest.other_dietary_notes || '');
          if (fetchedGuest.other_dietary_notes) setShowOtherText(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;
    if (status !== 'attending' && status !== 'declined') return;

    if (import.meta.env.DEV && guest.id === previewGuest.id) {
      setSuccess(true);
      return;
    }

    const submittedGuestId = guest.id;
    const submitId = ++submitIdRef.current;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const isAttending = status === 'attending';
      await submitGuestRsvp({
        guestId: submittedGuestId,
        status,
        guestsCount: isAttending ? guestsCount : 0,
        childrenCount: isAttending ? childrenCount : 0,
        isVegetarian: isAttending && isVegetarian,
        isVegan: isAttending && isVegan,
        isGlutenFree: isAttending && isGlutenFree,
        otherDietaryNotes: isAttending && showOtherText ? otherDietary : null,
      });
      if (submitId !== submitIdRef.current || guestIdRef.current !== submittedGuestId) return;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (submitId !== submitIdRef.current || guestIdRef.current !== submittedGuestId) return;
      setSubmitError('אירעה שגיאה בעדכון התשובה. נא לנסות שוב.');
    } finally {
      if (submitId === submitIdRef.current) setSubmitting(false);
    }
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

  if (success) {
    return (
      <GuestShell>
        <WeddingHeader />
        <div className="text-center">
          <h2 className="mb-2 font-display text-2xl font-semibold">תודה רבה</h2>
          <p className="leading-relaxed text-[#6B778C]">התשובה שלך נשמרה במערכת ועודכנה בהצלחה.</p>
          <p className="mt-3 font-medium" style={{ color: status === 'attending' ? wedding.gold : wedding.muted }}>
            {status === 'attending' ? 'נתראה בשמחה שלנו' : 'נתגעגע אליכם, תודה שעדכנתם.'}
          </p>
        </div>
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
            <section className="flex min-h-[6.1rem] items-center justify-between gap-3 border-t border-[#E6DCCB]">
              <div className="flex items-center gap-3">
                <IconPeople />
                <p className="text-[1.05rem] font-medium">כמות מבוגרים</p>
              </div>
              <Stepper
                value={guestsCount}
                min={1}
                onDecrease={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                onIncrease={() => setGuestsCount(guestsCount + 1)}
                decreaseLabel="הפחתת מבוגרים"
                increaseLabel="הוספת מבוגרים"
              />
            </section>

            <section className="flex min-h-[6.1rem] items-center justify-between gap-3 border-t border-[#E6DCCB]">
              <div className="flex items-center gap-3">
                <IconChild />
                <p className="text-[1.05rem] font-medium">כמות ילדים</p>
              </div>
              <Stepper
                value={childrenCount}
                min={0}
                onDecrease={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                onIncrease={() => setChildrenCount(childrenCount + 1)}
                decreaseLabel="הפחתת ילדים"
                increaseLabel="הוספת ילדים"
              />
            </section>

            <section className="border-t border-[#E6DCCB] pt-[1.35rem]">
              <div className="mb-[0.95rem] flex items-center gap-3">
                <IconWheat />
                <h2 className="text-[1.05rem] font-medium">העדפות קולינריות מיוחדות?</h2>
              </div>
              <div className="grid grid-cols-3 gap-[0.9rem]">
                <ChoiceButton selected={isVegetarian} onClick={() => setIsVegetarian(!isVegetarian)} tone="gold">
                  צמחוני
                </ChoiceButton>
                <ChoiceButton selected={isVegan} onClick={() => setIsVegan(!isVegan)} tone="gold">
                  טבעוני
                </ChoiceButton>
                <ChoiceButton selected={isGlutenFree} onClick={() => setIsGlutenFree(!isGlutenFree)} tone="gold">
                  ללא גלוטן
                </ChoiceButton>
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

              {showOtherText && (
                <textarea
                  id="other-dietary"
                  value={otherDietary}
                  onChange={(e) => setOtherDietary(e.target.value)}
                  aria-label="פירוט אלרגיות או בקשות מיוחדות"
                  placeholder="פירוט אלרגיות או בקשות מיוחדות..."
                  rows={2}
                  className="mt-2 w-full resize-none rounded-lg border border-[#C5A059] bg-white/75 p-3 text-base text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20"
                />
              )}
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

