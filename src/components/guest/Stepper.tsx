type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  compact?: boolean;
  inverted?: boolean;
};

export default function Stepper({
  value,
  min = 0,
  max,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  compact = false,
  inverted = false,
}: StepperProps) {
  const decreaseDisabled = value <= min;
  const increaseDisabled = max !== undefined && value >= max;
  const buttonClass = compact
    ? `inline-flex h-6 w-6 items-center justify-center rounded-full border transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${
        inverted
          ? 'border-white/70 bg-white/15 text-white'
          : 'border-[#C5A059]/85 bg-[#FBF8F2]/85 text-[#082D58]'
      }`
    : 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#C5A059]/85 bg-[#FBF8F2]/85 text-[#082D58] transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';
  const glyphClass = compact ? 'h-3 w-3' : 'h-[0.95rem] w-[0.95rem]';

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-4'}`} dir="ltr">
      <button
        type="button"
        onClick={onDecrease}
        disabled={decreaseDisabled}
        aria-label={decreaseLabel}
        className={buttonClass}
      >
        <svg viewBox="0 0 16 16" className={glyphClass} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <path d="M3.25 8h9.5" />
        </svg>
      </button>
      <span
        className={`text-center font-medium leading-none ${
          compact
            ? `w-4 text-[0.95rem] ${inverted ? 'text-white' : 'text-[#082D58]'}`
            : 'w-5 text-[1.65rem] text-[#082D58]'
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={increaseDisabled}
        aria-label={increaseLabel}
        className={buttonClass}
      >
        <svg viewBox="0 0 16 16" className={glyphClass} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <path d="M8 3.25v9.5M3.25 8h9.5" />
        </svg>
      </button>
    </div>
  );
}
