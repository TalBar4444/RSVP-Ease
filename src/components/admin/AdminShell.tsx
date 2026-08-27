import type { ReactNode } from 'react';
import LeafBackground from '../guest/LeafBackground';
import { IconHeart } from '../guest/icons';

export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-[#C5A059]/65" />
      <IconHeart />
      <div className="h-px flex-1 bg-[#C5A059]/65" />
    </div>
  );
}

export default function AdminShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#FBF8F2] text-[#082D58]" dir="rtl">
      <LeafBackground />
      <div
        className={`relative z-10 mx-auto w-full ${
          compact
            ? 'flex min-h-dvh items-center justify-center px-5 py-10'
            : 'max-w-6xl px-[clamp(1.1rem,4vw,2.5rem)] py-8 lg:py-12'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
