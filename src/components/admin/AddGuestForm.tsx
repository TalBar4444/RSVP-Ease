import { useEffect, useRef, useState } from 'react';
import { addGuest } from '../../lib/adminGuests';
import { toWhatsAppNumber } from '../../lib/guestInvites';
import type { Guest } from '../../types/guest';
import InviteActions from './InviteActions';

export default function AddGuestForm({ onGuestAdded }: { onGuestAdded: (guest: Guest) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [groupAffiliation, setGroupAffiliation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Guest | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedGroup = groupAffiliation.trim();

    if (!trimmedName) {
      setFormError('יש להזין שם.');
      return;
    }

    if (trimmedPhone && !toWhatsAppNumber(trimmedPhone)) {
      setFormError('מספר הטלפון אינו תקין.');
      return;
    }

    const requestId = ++requestIdRef.current;
    setSubmitting(true);
    setFormError(null);

    try {
      const created = await addGuest({
        name: trimmedName,
        phone: trimmedPhone || null,
        groupAffiliation: trimmedGroup || null,
      });

      if (requestId !== requestIdRef.current) return;
      onGuestAdded(created);
      setLastAdded(created);
      setName('');
      setPhone('');
      setGroupAffiliation('');
    } catch (err) {
      console.error(err);
      if (requestId !== requestIdRef.current) return;
      setFormError('לא ניתן להוסיף את האורח. נסו שוב בעוד רגע.');
    } finally {
      if (requestId === requestIdRef.current) setSubmitting(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-[#E6DCCB] bg-white/55 p-5 shadow-[0_8px_24px_rgba(8,45,88,0.04)]">
      <h2 className="mb-4 text-lg font-medium">הוספת אורח</h2>

      <form onSubmit={(event) => void handleSubmit(event)} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="guest-name" className="mb-2 block text-sm font-medium">
            שם המוזמן
          </label>
          <input
            id="guest-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם האורח"
            className="w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
          />
        </div>

        <div>
          <label htmlFor="guest-phone" className="mb-2 block text-sm font-medium">
            נייד
          </label>
          <input
            id="guest-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0501234567"
            className="w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="guest-group" className="mb-2 block text-sm font-medium">
            שיוך לקבוצה
          </label>
          <input
            id="guest-group"
            type="text"
            value={groupAffiliation}
            onChange={(e) => setGroupAffiliation(e.target.value)}
            placeholder="משפחה / חברים"
            className="w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#082D58] px-4 py-2.5 font-medium text-white shadow-[0_7px_18px_rgba(8,45,88,0.13)] transition-all active:scale-[0.99] disabled:bg-[#D9CDB8] disabled:text-[#8A93A6] disabled:shadow-none sm:col-span-2 lg:col-span-1"
        >
          {submitting ? 'מוסיף...' : 'הוספת אורח'}
        </button>
      </form>

      {formError ? <p className="mt-3 text-sm text-rose-700">{formError}</p> : null}

      {lastAdded ? (
        <div className="mt-4 rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/10 p-4">
          <p className="mb-3 text-sm text-[#082D58]">
            {lastAdded.name} נוסף לרשימה. שלחו את קישור האישור:
          </p>
          <InviteActions guest={lastAdded} messageType="invitation" />
        </div>
      ) : null}
    </section>
  );
}
