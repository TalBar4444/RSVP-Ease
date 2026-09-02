import { useEffect, useRef, useState } from 'react';
import { updateGuestGroup } from '../../lib/adminGuests';
import type { Guest } from '../../types/guest';

export default function EditableGroupCell({
  guest,
  onUpdated,
}: {
  guest: Guest;
  onUpdated: (guestId: string, groupAffiliation: string | null) => void;
}) {
  const affiliation = guest.group_affiliation ?? '';
  const [value, setValue] = useState(affiliation);
  const [prevAffiliation, setPrevAffiliation] = useState(affiliation);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const saveIdRef = useRef(0);

  if (affiliation !== prevAffiliation) {
    setPrevAffiliation(affiliation);
    setValue(affiliation);
  }

  useEffect(() => {
    return () => {
      saveIdRef.current += 1;
    };
  }, []);

  const save = async () => {
    const trimmed = value.trim();
    const nextValue = trimmed || null;
    if (nextValue === (guest.group_affiliation ?? null)) return;

    const saveId = ++saveIdRef.current;
    setSaving(true);
    setSaveError(false);

    try {
      await updateGuestGroup(guest.id, nextValue);
      if (saveId !== saveIdRef.current) return;
      onUpdated(guest.id, nextValue);
    } catch (err) {
      console.error(err);
      if (saveId !== saveIdRef.current) return;
      setSaveError(true);
      setValue(guest.group_affiliation ?? '');
    } finally {
      if (saveId === saveIdRef.current) setSaving(false);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => void save()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder="לדוגמה: משפחה / חברים"
      aria-label={`שיוך לקבוצה של ${guest.name}`}
      disabled={saving}
      aria-invalid={saveError}
      className={`min-w-[8rem] rounded-md border bg-[#FBF8F2] px-2 py-1 text-sm text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25 disabled:opacity-60 ${
        saveError ? 'border-rose-400' : 'border-[#C5A059]/50'
      }`}
    />
  );
}
