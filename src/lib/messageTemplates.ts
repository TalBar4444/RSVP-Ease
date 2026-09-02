import { wedding } from '../theme/wedding';

export const MESSAGE_TYPES = ['invitation', 'rsvp_reminder', 'day_of', 'thank_you'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const DEFAULT_MESSAGE_TYPE: MessageType = 'invitation';

const RING = '\u{1F48D}';
const WHITE_HEART = '\u{1F90D}';
const WINK = '\u{1F609}';
const POINT_DOWN = '\u{1F447}\u{1F3FD}';
const FOLDED_HANDS = '\u{1F64F}\u{1F3FD}';
const LTR = '\u200e';

export type MessageTemplate = {
  id: MessageType;
  label: string;
  hint: string;
  includesRsvpLink: boolean;
  build: (rsvpUrl?: string) => string;
};

function linkedLine(rsvpUrl: string | undefined): string {
  return rsvpUrl ? `${LTR}${rsvpUrl}` : '';
}

export const MESSAGE_TEMPLATES: Record<MessageType, MessageTemplate> = {
  invitation: {
    id: 'invitation',
    label: 'הזמנה',
    hint: 'ההודעה הראשונה לאורחים',
    includesRsvpLink: true,
    build: (rsvpUrl) =>
      [
        'משפחה וחברים יקרים,',
        `אנחנו שמחים ונרגשים להזמין אתכם לחתונה שלנו ${RING}`,
        'האירוע יתקיים ביום חמישי,',
        `ה-${wedding.date}, ב${wedding.venue}.`,
        `קבלת פנים בשעה ${wedding.receptionTime}.`,
        '',
        'נשמח לאישור הגעה בלינק המצורף.',
        linkedLine(rsvpUrl),
        '',
        'מצפים לראותכם,',
        `${wedding.coupleFull} ${WHITE_HEART}`,
      ].join('\n'),
  },
  rsvp_reminder: {
    id: 'rsvp_reminder',
    label: 'תזכורת אישור',
    hint: 'מומלץ לאורחים שעדיין לא השיבו',
    includesRsvpLink: true,
    build: (rsvpUrl) =>
      [
        'היי!',
        `יש מצב שפספסת את ההודעה שלנו אז אנחנו שולחים תזכורת ${WINK}`,
        `טרם אישרת הגעה לחתונה, בתאריך ${wedding.date} ב${wedding.venue}.`,
        '',
        `לעדכון הגעה לחצו על הקישור ${POINT_DOWN}`,
        linkedLine(rsvpUrl),
        '',
        `${wedding.coupleFull}.`,
      ].join('\n'),
  },
  day_of: {
    id: 'day_of',
    label: 'תזכורת ליום האירוע',
    hint: 'מומלץ לאורחים שאישרו הגעה, ביום האירוע',
    includesRsvpLink: false,
    build: () =>
      [
        '*תזכורת!*',
        `החתונה של ${wedding.coupleShort} תתקיים היום החל מהשעה ${wedding.receptionTime} ב${wedding.venue}.`,
        '',
        'מחכים לראותכם!',
      ].join('\n'),
  },
  thank_you: {
    id: 'thank_you',
    label: 'תודה',
    hint: 'מומלץ לאורחים שהגיעו, אחרי החתונה',
    includesRsvpLink: false,
    build: () =>
      [
        'משפחה וחברים אהובים,',
        'תודה שלקחתם חלק בשמחה שלנו!',
        '',
        `מקווים שנהנתם ושניפגש רק בשמחות ${FOLDED_HANDS}`,
        'אוהבים המון,',
        `${wedding.coupleShort} ${WHITE_HEART}`,
      ].join('\n'),
  },
};

export const MESSAGE_TYPE_LIST: MessageTemplate[] = MESSAGE_TYPES.map((id) => MESSAGE_TEMPLATES[id]);

export function isMessageType(value: string): value is MessageType {
  return MESSAGE_TYPES.some((type) => type === value);
}

export function getMessageTemplate(type: MessageType): MessageTemplate {
  return MESSAGE_TEMPLATES[type];
}
