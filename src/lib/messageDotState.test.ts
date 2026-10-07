import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GuestOutreach } from './guestOutreach';
import { describeMessageDot } from './messageDotState';
import { MESSAGE_TYPES, tracksGuestLinkOpen } from './messageTemplates';

const openedAt = '2026-09-13T10:00:00.000Z';
const sentAt = '2026-09-12T10:00:00.000Z';

const emptyOutreach: GuestOutreach = { sends: {}, linkOpenedAt: null };

const openedOutreach: GuestOutreach = {
  sends: {},
  linkOpenedAt: openedAt,
};

const reminderSentAndOpened: GuestOutreach = {
  sends: {
    rsvp_reminder: { channel: 'whatsapp', sentAt },
  },
  linkOpenedAt: openedAt,
};

const dayOfSentAndOpened: GuestOutreach = {
  sends: {
    day_of: { channel: 'sms', sentAt },
  },
  linkOpenedAt: openedAt,
};

const invitationSentAndOpened: GuestOutreach = {
  sends: {
    invitation: { channel: 'copy', sentAt },
  },
  linkOpenedAt: openedAt,
};

describe('tracksGuestLinkOpen', () => {
  it('is true only for invitation', () => {
    assert.equal(tracksGuestLinkOpen('invitation'), true);
    assert.equal(tracksGuestLinkOpen('rsvp_reminder'), false);
    assert.equal(tracksGuestLinkOpen('day_of'), false);
    assert.equal(tracksGuestLinkOpen('thank_you'), false);
  });
});

describe('describeMessageDot', () => {
  it('marks invitation opened when the RSVP page was loaded, even if not sent', () => {
    const dot = describeMessageDot('invitation', openedOutreach);
    assert.equal(dot.state, 'opened');
    assert.match(dot.label, /נפתח/);
    assert.doesNotMatch(dot.label, /נשלח/);
  });

  it('keeps reminder empty when the page was opened but the reminder was not sent', () => {
    const dot = describeMessageDot('rsvp_reminder', openedOutreach);
    assert.equal(dot.state, 'empty');
    assert.match(dot.label, /טרם נשלח/);
  });

  it('marks reminder sent, not opened, when it was sent and the page was opened', () => {
    const dot = describeMessageDot('rsvp_reminder', reminderSentAndOpened);
    assert.equal(dot.state, 'sent');
    assert.match(dot.label, /נשלח/);
    assert.doesNotMatch(dot.label, /נפתח/);
  });

  it('never marks day-of or thank-you as opened from a page load', () => {
    assert.equal(describeMessageDot('day_of', openedOutreach).state, 'empty');
    assert.equal(describeMessageDot('thank_you', openedOutreach).state, 'empty');
    assert.equal(describeMessageDot('day_of', dayOfSentAndOpened).state, 'sent');
    assert.doesNotMatch(describeMessageDot('day_of', dayOfSentAndOpened).label, /נפתח/);
  });

  it('can show invitation opened together with sent', () => {
    const dot = describeMessageDot('invitation', invitationSentAndOpened);
    assert.equal(dot.state, 'opened');
    assert.match(dot.label, /נפתח/);
    assert.match(dot.label, /נשלח/);
  });

  it('leaves every type empty when nothing was sent or opened', () => {
    for (const type of MESSAGE_TYPES) {
      assert.equal(describeMessageDot(type, emptyOutreach).state, 'empty');
    }
  });
});
