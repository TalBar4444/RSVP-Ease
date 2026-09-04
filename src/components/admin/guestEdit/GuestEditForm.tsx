import { useEffect, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import FormField, { adminInputClassName } from '../FormField';
import { DIET_LABELS } from '../guestDiet';
import { GUEST_STATUSES, STATUS_LABELS, STATUS_STYLES } from '../guestStatus';
import { MAX_PARTY_COUNT, NEW_GROUP_VALUE, parseCount, type GuestDraft } from './guestDraft';

function ChoiceChip({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        selected
          ? 'border-[#C5A059] bg-[#C5A059] text-white'
          : 'border-[#C5A059]/60 bg-white text-[#6F7C91] hover:border-[#C5A059] hover:bg-[#FBF8F2]'
      }`}
    >
      {children}
    </button>
  );
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

  const handleCountChange = (field: 'guestsCount' | 'childrenCount', value: string) => {
    const next = parseCount(value);
    if (next === null) return;
    patchDraft({ [field]: next });
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
        <div className="flex gap-2" role="radiogroup" aria-label="סטטוס">
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
          <div className="grid grid-cols-2 gap-3">
            <FormField id="guest-edit-adults" label="מבוגרים">
              <input
                id="guest-edit-adults"
                type="number"
                min={attending ? 1 : 0}
                max={MAX_PARTY_COUNT}
                value={draft.guestsCount}
                disabled={saving}
                onChange={(event) => handleCountChange('guestsCount', event.target.value)}
                className={adminInputClassName}
              />
            </FormField>
            <FormField id="guest-edit-children" label="ילדים">
              <input
                id="guest-edit-children"
                type="number"
                min={0}
                max={MAX_PARTY_COUNT}
                value={draft.childrenCount}
                disabled={saving}
                onChange={(event) => handleCountChange('childrenCount', event.target.value)}
                className={adminInputClassName}
              />
            </FormField>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#082D58]">העדפות תזונה</p>
            <div className="flex flex-wrap gap-2">
              <ChoiceChip
                selected={draft.isVegetarian}
                disabled={saving}
                onClick={() => patchDraft({ isVegetarian: !draft.isVegetarian })}
              >
                {DIET_LABELS.vegetarian}
              </ChoiceChip>
              <ChoiceChip
                selected={draft.isVegan}
                disabled={saving}
                onClick={() => patchDraft({ isVegan: !draft.isVegan })}
              >
                {DIET_LABELS.vegan}
              </ChoiceChip>
              <ChoiceChip
                selected={draft.isGlutenFree}
                disabled={saving}
                onClick={() => patchDraft({ isGlutenFree: !draft.isGlutenFree })}
              >
                {DIET_LABELS.glutenFree}
              </ChoiceChip>
            </div>
          </div>
          <FormField id="guest-edit-notes" label="הערות תזונה">
            <textarea
              id="guest-edit-notes"
              rows={2}
              value={draft.otherDietaryNotes}
              disabled={saving}
              onChange={(event) => patchDraft({ otherDietaryNotes: event.target.value })}
              placeholder="אלרגיות או בקשות מיוחדות"
              className={`${adminInputClassName} resize-none`}
            />
          </FormField>
        </>
      ) : null}

      {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
    </div>
  );
}
