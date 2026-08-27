import { useEffect, useMemo, useState } from 'react';
import { deleteGuest, updateGuestGroup } from '../../lib/adminGuests';
import type { Guest, GuestStatus } from '../../types/guest';
import InviteActions from './InviteActions';

type StatusFilter = 'all' | GuestStatus;

const STATUS_LABELS: Record<GuestStatus, string> = {
  attending: 'מגיע',
  declined: 'לא מגיע',
  pending: 'ממתין',
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'attending', label: STATUS_LABELS.attending },
  { value: 'declined', label: STATUS_LABELS.declined },
  { value: 'pending', label: STATUS_LABELS.pending },
];

const STATUS_STYLES: Record<GuestStatus, string> = {
  attending: 'border-[#082D58] bg-[#082D58] text-white',
  declined: 'border-[#C5A059]/70 bg-white/60 text-[#082D58]',
  pending: 'border-[#C5A059] bg-[#C5A059]/15 text-[#8A6A2E]',
};

function StatusBadge({ status }: { status: GuestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DietaryBadges({ guest }: { guest: Guest }) {
  const badges: string[] = [];

  if (guest.is_vegetarian) badges.push('צמחוני');
  if (guest.is_vegan) badges.push('טבעוני');
  if (guest.is_gluten_free) badges.push('ללא גלוטן');

  if (badges.length === 0 && !guest.other_dietary_notes) {
    return <span className="text-sm text-[#9AA6B8]">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {badges.map((label) => (
            <span
              key={label}
              className="inline-flex rounded-md border border-[#C5A059]/80 bg-[#C5A059] px-2 py-0.5 text-xs font-medium text-white"
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

function EditableGroupCell({
  guest,
  onUpdated,
}: {
  guest: Guest;
  onUpdated: (guestId: string, groupAffiliation: string | null) => void;
}) {
  const [value, setValue] = useState(guest.group_affiliation ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setValue(guest.group_affiliation ?? '');
  }, [guest.group_affiliation]);

  const save = async () => {
    const trimmed = value.trim();
    const nextValue = trimmed || null;
    if (nextValue === (guest.group_affiliation ?? null)) return;

    setSaving(true);
    setSaveError(false);

    try {
      await updateGuestGroup(guest.id, nextValue);
      onUpdated(guest.id, nextValue);
    } catch (err) {
      console.error(err);
      setSaveError(true);
      setValue(guest.group_affiliation ?? '');
    } finally {
      setSaving(false);
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
      disabled={saving}
      aria-invalid={saveError}
      className={`min-w-[8rem] rounded-md border bg-[#FBF8F2] px-2 py-1 text-sm text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25 disabled:opacity-60 ${
        saveError ? 'border-rose-400' : 'border-[#C5A059]/50'
      }`}
    />
  );
}

function ConfirmDialog({
  open,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#082D58]/45 px-4"
      onClick={loading ? undefined : onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-2xl border border-[#E6DCCB] bg-[#FBF8F2] p-6 shadow-[0_16px_40px_rgba(8,45,88,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="text-center text-lg font-medium text-[#082D58]">
          {message}
        </h3>

        {error ? <p className="mt-3 text-center text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#C5A059]/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-[#082D58] transition-colors hover:bg-white disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg border border-rose-400 bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? 'מוחק...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteGuestButton({
  guest,
  onDeleted,
}: {
  guest: Guest;
  onDeleted: (guestId: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteGuest(guest.id);
      setShowConfirm(false);
      onDeleted(guest.id);
    } catch (err) {
      console.error(err);
      setDeleteError('לא ניתן להסיר את האורח. נסו שוב בעוד רגע.');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setShowConfirm(false);
    setDeleteError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="rounded-lg border border-rose-300/80 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
      >
        הסר
      </button>

      <ConfirmDialog
        open={showConfirm}
        message={`אתה בטוח שאתה רוצה למחוק את ${guest.name}?`}
        confirmLabel="מחק"
        cancelLabel="ביטול"
        loading={deleting}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={handleClose}
      />
    </>
  );
}

export default function GuestList({
  guests,
  onGroupUpdated,
  onDeleted,
}: {
  guests: Guest[];
  onGroupUpdated: (guestId: string, groupAffiliation: string | null) => void;
  onDeleted: (guestId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return guests.filter((guest) => {
      const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        guest.name.toLowerCase().includes(query) ||
        (guest.group_affiliation?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [guests, searchQuery, statusFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all';

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E6DCCB] bg-white/55 shadow-[0_8px_24px_rgba(8,45,88,0.04)]">
      <div className="border-b border-[#E6DCCB] p-5">
        <h2 className="mb-4 text-lg font-medium">רשימת אורחים</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם או קבוצה..."
            className="w-full max-w-sm rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
          />
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="סינון לפי סטטוס">
            {STATUS_FILTERS.map((filter) => {
              const selected = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? filter.value === 'all'
                        ? 'border-[#082D58] bg-[#082D58] text-white'
                        : STATUS_STYLES[filter.value]
                      : 'border-[#C5A059]/60 bg-white/70 text-[#6F7C91] hover:border-[#C5A059] hover:bg-white'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-[#E6DCCB] bg-[#FBF8F2]/80">
              <th className="px-5 py-3 font-medium text-[#6F7C91]">שם המוזמן</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">נייד</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">שיוך לקבוצה</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">סטטוס</th>
              <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">מבוגרים</th>
              <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">ילדים</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">תזונה</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">הזמנה</th>
              <th className="px-5 py-3 font-medium text-[#6F7C91]">הסרה</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-[#9AA6B8]">
                  {hasActiveFilters ? 'לא נמצאו אורחים תואמים לסינון.' : 'עדיין אין אורחים ברשימה.'}
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-[#E6DCCB]/70 transition-colors hover:bg-[#FBF8F2]/80">
                  <td className="px-5 py-3 font-medium">{guest.name}</td>
                  <td className="px-5 py-3 text-[#6F7C91]" dir="ltr">
                    {guest.phone ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <EditableGroupCell guest={guest} onUpdated={onGroupUpdated} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={guest.status} />
                  </td>
                  <td className="px-5 py-3 text-center">{guest.guests_count}</td>
                  <td className="px-5 py-3 text-center">{guest.children_count}</td>
                  <td className="px-5 py-3">
                    <DietaryBadges guest={guest} />
                  </td>
                  <td className="px-5 py-3">
                    <InviteActions guest={guest} />
                  </td>
                  <td className="px-5 py-3">
                    <DeleteGuestButton guest={guest} onDeleted={onDeleted} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#E6DCCB] px-5 py-3 text-xs text-[#9AA6B8]">
        מציג {filteredGuests.length} מתוך {guests.length} אורחים
      </div>
    </section>
  );
}
