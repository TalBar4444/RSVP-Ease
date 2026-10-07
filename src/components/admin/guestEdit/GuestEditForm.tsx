import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { remainingSpecialMeals, type DietCounts } from '../../../lib/dietCounts';
import { MAX_DIETARY_NOTES_LENGTH } from '../../../types/guest';
import FormField, { adminInputClassName } from '../FormField';
import { DIET_LABELS } from '../guestDiet';
import { GUEST_STATUSES, STATUS_LABELS, STATUS_STYLES } from '../guestStatus';
import {
  applyDietCounts,
  MAX_PARTY_COUNT,
  NEW_GROUP_VALUE,
  parseCount,
  type GuestDraft,
} from './guestDraft';

function draftDiets(draft: GuestDraft): DietCounts {
  return {
    vegetarianCount: draft.vegetarianCount,
    veganCount: draft.veganCount,
    glutenFreeCount: draft.glutenFreeCount,
    kidsMealCount: draft.kidsMealCount,
  };
}

function GroupAffiliationField({
  options,
  draft,
  disabled,
  onChange,
}: {
  options: string[];
  draft: GuestDraft;
  disabled: boolean;
  onChange: (next: Pick<GuestDraft, 'groupAffiliation' | 'creatingNewGroup' | 'newGroupName'>) => void;
}) {
  const selectValue = draft.creatingNewGroup ? NEW_GROUP_VALUE : draft.groupAffiliation;
  const selectOptions =
    draft.groupAffiliation && !options.includes(draft.groupAffiliation)
      ? [...options, draft.groupAffiliation]
      : options;

  return (
    <div className="space-y-2">
      <select
        id="guest-edit-group"
        value={selectValue}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (next === NEW_GROUP_VALUE) {
            onChange({
              groupAffiliation: '',
              creatingNewGroup: true,
              newGroupName: '',
            });
            return;
          }
          onChange({
            groupAffiliation: next,
            creatingNewGroup: false,
            newGroupName: '',
          });
        }}
        className={adminInputClassName}
      >
        <option value="">ללא שיוך</option>
        {selectOptions.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={NEW_GROUP_VALUE}>קבוצה חדשה...</option>
      </select>
      {draft.creatingNewGroup ? (
        <input
          id="guest-edit-new-group"
          type="text"
          value={draft.newGroupName}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              groupAffiliation: '',
              creatingNewGroup: true,
              newGroupName: event.target.value,
            })
          }
          placeholder="שם הקבוצה החדשה"
          aria-label="שם הקבוצה החדשה"
          className={adminInputClassName}
        />
      ) : null}
    </div>
  );
}

export default function GuestEditForm({
  draft,
  groupOptions,
  saving,
  formError,
  countsLocked,
  onDraftChange,
}: {
  draft: GuestDraft;
  groupOptions: string[];
  saving: boolean;
  formError: string | null;
  countsLocked: boolean;
  onDraftChange: Dispatch<SetStateAction<GuestDraft>>;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const attending = draft.status === 'attending';

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const patchDraft = (patch: Partial<GuestDraft>) => {
    onDraftChange((current) => ({ ...current, ...patch }));
  };

  const handleGuestsCountChange = (value: string) => {
    const next = parseCount(value);
    if (next === null) return;
    onDraftChange((current) => applyDietCounts(current, draftDiets(current), next));
  };

  const handleDietCountChange = (field: keyof DietCounts, value: string) => {
    const parsed = parseCount(value);
    if (parsed === null) return;
    onDraftChange((current) => {
      const currentDiets = draftDiets(current);
      const remaining = remainingSpecialMeals(currentDiets, current.guestsCount);
      const max = currentDiets[field] + remaining;
      return applyDietCounts(current, {
        ...currentDiets,
        [field]: Math.min(Math.max(0, parsed), max),
      });
    });
  };

  return (
    <div className="space-y-4 px-5 py-4">
      <FormField id="guest-edit-name" label="שם המוזמן">
        <input
          ref={nameRef}
          id="guest-edit-name"
          type="text"
          value={draft.name}
          disabled={saving}
          onChange={(event) => patchDraft({ name: event.target.value })}
          className={adminInputClassName}
        />
      </FormField>
      <FormField id="guest-edit-phone" label="נייד">
        <input
          id="guest-edit-phone"
          type="tel"
          dir="ltr"
          value={draft.phone}
          disabled={saving}
          onChange={(event) => patchDraft({ phone: event.target.value })}
          placeholder="0501234567"
          className={adminInputClassName}
        />
      </FormField>
      <FormField id="guest-edit-group" label="שיוך לקבוצה">
        <GroupAffiliationField
          options={groupOptions}
          draft={draft}
          disabled={saving}
          onChange={(next) => patchDraft(next)}
        />
      </FormField>
      <div>
        <p className="mb-1.5 text-sm font-medium text-[#082D58]">סטטוס</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="סטטוס">
          {GUEST_STATUSES.map((status) => {
            const selected = draft.status === status;
            return (
              <button
                key={status}
                type="button"
                role="radio"
                disabled={saving}
                aria-checked={selected}
                onClick={() =>
                  patchDraft({
                    status,
                    guestsCount: status === 'attending' && draft.guestsCount < 1 ? 1 : draft.guestsCount,
                  })
                }
                className={`min-w-max flex-1 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
                  selected
                    ? STATUS_STYLES[status]
                    : 'border-[#E6DCCB] bg-[#FBF8F2] text-[#6F7C91] hover:border-[#C5A059]'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {!countsLocked ? (
        <>
          <FormField id="guest-edit-guests" label="אורחים">
            <input
              id="guest-edit-guests"
              type="number"
              min={attending ? 1 : 0}
              max={MAX_PARTY_COUNT}
              value={draft.guestsCount}
              disabled={saving}
              onChange={(event) => handleGuestsCountChange(event.target.value)}
              className={adminInputClassName}
            />
          </FormField>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#082D58]">העדפות תזונה</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="guest-edit-vegetarian" label={DIET_LABELS.vegetarian}>
                <input
                  id="guest-edit-vegetarian"
                  type="number"
                  min={0}
                  max={draft.vegetarianCount + remainingSpecialMeals(draftDiets(draft), draft.guestsCount)}
                  value={draft.vegetarianCount}
                  disabled={saving}
                  onChange={(event) => handleDietCountChange('vegetarianCount', event.target.value)}
                  className={adminInputClassName}
                />
              </FormField>
              <FormField id="guest-edit-vegan" label={DIET_LABELS.vegan}>
                <input
                  id="guest-edit-vegan"
                  type="number"
                  min={0}
                  max={draft.veganCount + remainingSpecialMeals(draftDiets(draft), draft.guestsCount)}
                  value={draft.veganCount}
                  disabled={saving}
                  onChange={(event) => handleDietCountChange('veganCount', event.target.value)}
                  className={adminInputClassName}
                />
              </FormField>
              <FormField id="guest-edit-gluten-free" label={DIET_LABELS.glutenFree}>
                <input
                  id="guest-edit-gluten-free"
                  type="number"
                  min={0}
                  max={draft.glutenFreeCount + remainingSpecialMeals(draftDiets(draft), draft.guestsCount)}
                  value={draft.glutenFreeCount}
                  disabled={saving}
                  onChange={(event) => handleDietCountChange('glutenFreeCount', event.target.value)}
                  className={adminInputClassName}
                />
              </FormField>
              <FormField id="guest-edit-kids-meal" label={DIET_LABELS.kidsMeal}>
                <input
                  id="guest-edit-kids-meal"
                  type="number"
                  min={0}
                  max={draft.kidsMealCount + remainingSpecialMeals(draftDiets(draft), draft.guestsCount)}
                  value={draft.kidsMealCount}
                  disabled={saving}
                  onChange={(event) => handleDietCountChange('kidsMealCount', event.target.value)}
                  className={adminInputClassName}
                />
              </FormField>
            </div>
          </div>
          <FormField id="guest-edit-notes" label="הערות תזונה">
            <textarea
              id="guest-edit-notes"
              rows={2}
              value={draft.otherDietaryNotes}
              disabled={saving}
              onChange={(event) =>
                patchDraft({ otherDietaryNotes: event.target.value.slice(0, MAX_DIETARY_NOTES_LENGTH) })
              }
              maxLength={MAX_DIETARY_NOTES_LENGTH}
              placeholder="אלרגיות או בקשות מיוחדות"
              className={`${adminInputClassName} resize-none`}
            />
            <p className="mt-1 text-left text-xs text-[#9AA6B8]" dir="ltr">
              {draft.otherDietaryNotes.length}/{MAX_DIETARY_NOTES_LENGTH}
            </p>
          </FormField>
        </>
      ) : null}

      {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
    </div>
  );
}
