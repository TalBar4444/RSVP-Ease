import type { MessageType } from '../../lib/messageTemplates';
import type { GuestOutreach } from '../../lib/guestOutreach';
import type { Guest } from '../../types/guest';
import DietaryBadges from './DietaryBadges';
import InviteActions from './InviteActions';
import MessageStatusDots from './MessageStatusDots';
import StatusBadge from './StatusBadge';

export default function GuestCard({
  guest,
  outreach,
  messageType,
  onSelect,
  onToggleSend,
}: {
  guest: Guest;
  outreach: GuestOutreach;
  messageType: MessageType;
  onSelect: () => void;
  onToggleSend: () => void;
}) {
  return (
    <article
      className="cursor-pointer px-4 py-4 text-start transition-colors hover:bg-[#FBF8F2]/80"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#082D58]">{guest.name}</p>
          <p className="mt-0.5 text-sm text-[#6F7C91]" dir="ltr">
            {guest.phone ?? '—'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={guest.status} />
          <div onClick={(event) => event.stopPropagation()}>
            <MessageStatusDots
              outreach={outreach}
              selectedType={messageType}
              onToggleSelected={onToggleSend}
            />
          </div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-[#9AA6B8]">שיוך לקבוצה</dt>
          <dd className="truncate text-[#6F7C91]">{guest.group_affiliation ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#9AA6B8]">אורחים</dt>
          <dd className="text-[#082D58]">{guest.guests_count}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <DietaryBadges guest={guest} align="start" />
      </div>

      <div className="mt-3" onClick={(event) => event.stopPropagation()}>
        <InviteActions guest={guest} messageType={messageType} />
      </div>
    </article>
  );
}
