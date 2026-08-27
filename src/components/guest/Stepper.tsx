type StepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
};

export default function Stepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: StepperProps) {
  return (
    <div className="flex items-center gap-4" dir="ltr">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={decreaseLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C5A059]/85 bg-[#FBF8F2]/85 text-xl font-light leading-none text-[#082D58] transition-transform active:scale-90"
      >
        −
      </button>
      <span className="w-5 text-center text-[1.65rem] font-medium leading-none text-[#082D58]">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={increaseLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C5A059]/85 bg-[#FBF8F2]/85 text-xl font-light leading-none text-[#082D58] transition-transform active:scale-90"
      >
        +
      </button>
    </div>
  );
}
