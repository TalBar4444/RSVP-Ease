import type { GuestStatus } from '../../types/guest';
import { STATUS_LABELS, STATUS_STYLES } from './guestStatus';

export default function StatusBadge({ status }: { status: GuestStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
