import { useEffect, useMemo, useRef, useState } from 'react';
import { getGuestMessage } from '../../lib/guestInvites';
import {
  DEFAULT_MESSAGE_TYPE,
  MESSAGE_TYPE_LIST,
  getMessageTemplate,
  isMessageType,
  type MessageType,
} from '../../lib/messageTemplates';
import type { Guest, GuestStatus } from '../../types/guest';
import { IconPencil } from './AdminIcons';
import DietaryBadges from './DietaryBadges';
import GuestEditDialog from './guestEdit/GuestEditDialog';
import { STATUS_LABELS, STATUS_STYLES } from './guestStatus';
import InviteActions from './InviteActions';
import StatusBadge from './StatusBadge';

type StatusFilter = 'all' | GuestStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'attending', label: STATUS_LABELS.attending },
  { value: 'declined', label: STATUS_LABELS.declined },
  { value: 'pending', label: STATUS_LABELS.pending },
];

export default function GuestList({
  guests,
  onGuestUpdated,
  onDeleted,
}: {
  guests: Guest[];
  onGuestUpdated: (guest: Guest) => void;
  onDeleted: (guestId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [messageType, setMessageType] = useState<MessageType>(DEFAULT_MESSAGE_TYPE);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
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

  const groupOptions = useMemo(() => {
    const names = new Set<string>();
    for (const guest of guests) {
      const value = guest.group_affiliation?.trim();
      if (value) names.add(value);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'he'));
  }, [guests]);

  const selectedGuest = selectedGuestId
    ? (guests.find((guest) => guest.id === selectedGuestId) ?? null)
    : null;

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
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
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
                <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">שיוך לקבוצה</th>
                <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">סטטוס</th>
                <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">מבוגרים</th>
                <th className="px-5 py-3 text-center font-medium text-[#6F7C91]">ילדים</th>
                <th className="px-5 py-3 font-medium text-[#6F7C91]">תזונה</th>
                <th className="px-5 py-3 font-medium text-[#6F7C91]">שליחה</th>
                <th className="px-5 py-3 font-medium text-[#6F7C91]">עריכה</th>
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
                  <tr key={guest.id} className="border-b border-[#E6DCCB]/70">
                    <td className="px-5 py-3 font-medium">{guest.name}</td>
                    <td className="px-5 py-3 text-[#6F7C91]" dir="ltr">
                      {guest.phone ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-[#6F7C91]">{guest.group_affiliation ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
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
                      <button
                        type="button"
                        onClick={() => setSelectedGuestId(guest.id)}
                        aria-label={`עריכת ${guest.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#C5A059]/80 bg-white px-2.5 py-1.5 text-xs font-medium text-[#082D58] transition-colors hover:bg-[#FBF8F2]"
                      >
                        <IconPencil />
                        עריכה
                      </button>
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

      {selectedGuest ? (
        <GuestEditDialog
          key={selectedGuest.id}
          guest={selectedGuest}
          groupOptions={groupOptions}
          onClose={() => setSelectedGuestId(null)}
          onUpdated={onGuestUpdated}
          onDeleted={(guestId) => {
            onDeleted(guestId);
            setSelectedGuestId(null);
          }}
        />
      ) : null}
    </section>
  );
}
