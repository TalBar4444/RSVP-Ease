import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteGuest } from '../../lib/adminGuests';
import { getGuestMessage } from '../../lib/guestInvites';
import {
  DEFAULT_MESSAGE_TYPE,
  MESSAGE_TYPE_LIST,
  getMessageTemplate,
  isMessageType,
  type MessageType,
} from '../../lib/messageTemplates';
import type { Guest, GuestStatus } from '../../types/guest';
import ConfirmDialog from './ConfirmDialog';
import EditableGroupCell from './EditableGroupCell';
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const handleDelete = async () => {
    const requestId = ++requestIdRef.current;
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteGuest(guest.id);
      if (requestId !== requestIdRef.current) return;
      setShowConfirm(false);
      onDeleted(guest.id);
    } catch (err) {
      console.error(err);
      if (requestId !== requestIdRef.current) return;
      setDeleteError('לא ניתן להסיר את האורח. נסו שוב בעוד רגע.');
    } finally {
      if (requestId === requestIdRef.current) setDeleting(false);
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
        aria-label={`הסר את ${guest.name}`}
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
        loadingLabel="מוחק..."
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
  const [messageType, setMessageType] = useState<MessageType>(DEFAULT_MESSAGE_TYPE);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = getMessageTemplate(messageType);
  const messagePreview = getGuestMessage(messageType, 'preview');

  useEffect(() => {
    if (!previewOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (previewRef.current?.contains(event.target as Node)) return;
      setPreviewOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewOpen]);

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
    <section className="rounded-2xl border border-[#E6DCCB] bg-white/55 shadow-[0_8px_24px_rgba(8,45,88,0.04)]">
      <div className="border-b border-[#E6DCCB] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">רשימת אורחים</h2>
          <div className="flex items-center gap-2" ref={previewRef}>
            <label htmlFor="message-type" className="text-xs font-medium text-[#6F7C91]">
              סוג הודעה
            </label>
            <select
              id="message-type"
              value={messageType}
              onChange={(e) => {
                if (isMessageType(e.target.value)) setMessageType(e.target.value);
              }}
              title={selectedTemplate.hint}
              className="max-w-[11rem] rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-2.5 py-1.5 text-xs font-medium text-[#082D58] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
            >
              {MESSAGE_TYPE_LIST.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <button
                type="button"
                aria-expanded={previewOpen}
                aria-controls="message-preview"
                onClick={() => setPreviewOpen((open) => !open)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  previewOpen
                    ? 'border-[#082D58] bg-[#082D58] text-white'
                    : 'border-[#C5A059]/60 bg-white/70 text-[#6F7C91] hover:border-[#C5A059] hover:bg-white'
                }`}
              >
                תצוגה
              </button>
              {previewOpen ? (
                <div
                  id="message-preview"
                  role="region"
                  aria-label="תצוגה מקדימה של ההודעה"
                  className="absolute end-0 z-20 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-[#E6DCCB] bg-[#FBF8F2] p-3 text-start shadow-[0_12px_28px_rgba(8,45,88,0.12)]"
                >
                  <p className="mb-2 text-xs text-[#9AA6B8]">{selectedTemplate.hint}</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[#082D58]">
                    {messagePreview}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-sm">
            <label htmlFor="guest-search" className="sr-only">
              חיפוש לפי שם או קבוצה
            </label>
            <input
              id="guest-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם או קבוצה..."
              className="w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
            />
          </div>
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

      <div className="overflow-hidden rounded-b-2xl">
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
                <th className="px-5 py-3 font-medium text-[#6F7C91]">שליחה</th>
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
                      <InviteActions guest={guest} messageType={messageType} />
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
      </div>
    </section>
  );
}
