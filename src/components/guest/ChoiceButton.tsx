import type { ReactNode } from 'react';
import { IconCheck } from './icons';

type ChoiceButtonProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: 'navy' | 'gold';
  className?: string;
};

export default function ChoiceButton({
  selected,
  onClick,
  children,
  tone = 'navy',
  className = '',
}: ChoiceButtonProps) {
  const selectedClass =
    tone === 'gold'
      ? 'border border-[#C5A059] bg-[#C5A059] text-white shadow-[0_5px_14px_rgba(197,160,89,0.18)]'
      : 'border border-[#082D58] bg-[#082D58] text-white shadow-[0_5px_16px_rgba(8,45,88,0.15)]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-[0.95rem] font-normal transition-all duration-200 active:scale-[0.98] ${
        selected ? selectedClass : 'border border-[#C5A059]/80 bg-[#FBF8F2]/80 text-[#082D58] hover:bg-white'
      } ${className}`}
    >
      {selected ? (
        <IconCheck className={`h-[1.15rem] w-[1.15rem] ${tone === 'navy' ? 'text-[#D3AE62]' : 'text-white'}`} />
      ) : null}
      {children}
    </button>
  );
}
