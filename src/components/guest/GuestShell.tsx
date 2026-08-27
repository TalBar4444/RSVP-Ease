import type { ReactNode } from 'react';
import LeafBackground from './LeafBackground';

export default function GuestShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#FBF8F2] text-[#082D58]" dir="rtl">
      <LeafBackground />
      <main className="relative z-10 mx-auto w-full max-w-[473px] px-[clamp(1.35rem,7.8vw,2.3rem)] pb-[max(2.4rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
