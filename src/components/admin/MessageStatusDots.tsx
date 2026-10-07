import { describeMessageDot } from '../../lib/messageDotState';
import type { GuestOutreach } from '../../lib/guestOutreach';
import { MESSAGE_TYPES, type MessageType } from '../../lib/messageTemplates';

const DOT_CLASS: Record<'empty' | 'sent' | 'opened', string> = {
  empty: 'border-[#C5A059]/70 bg-transparent',
  sent: 'border-[#C5A059] bg-[#C5A059]',
  opened: 'border-[#082D58] bg-[#082D58]',
};

export default function MessageStatusDots({
  outreach,
  selectedType,
  onToggleSelected,
}: {
  outreach: GuestOutreach;
  selectedType: MessageType;
  onToggleSelected: () => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="סטטוס הודעות">
      {MESSAGE_TYPES.map((type) => {
        const { state, label } = describeMessageDot(type, outreach);
        const selected = type === selectedType;
        const className = `h-2.5 w-2.5 rounded-full border ${DOT_CLASS[state]} ${
          selected ? 'ring-2 ring-[#082D58] ring-offset-1 ring-offset-[#FBF8F2]' : ''
        }`;

        if (selected) {
          const sent = Boolean(outreach.sends[type]);
          const action = sent ? 'לחצו לביטול הסימון' : 'לחצו לסימון כנשלח';
          return (
            <button
              key={type}
              type="button"
              title={`${label}. ${action}`}
              aria-label={`${label}. ${action}`}
              aria-pressed={sent}
              onClick={onToggleSelected}
              className="inline-flex min-h-9 min-w-9 items-center justify-center lg:min-h-0 lg:min-w-0 lg:p-1"
            >
              <span className={className} />
            </button>
          );
        }

        return (
          <span key={type} title={label} className="inline-flex p-1">
            <span className={className} aria-label={label} />
          </span>
        );
      })}
    </div>
  );
}
