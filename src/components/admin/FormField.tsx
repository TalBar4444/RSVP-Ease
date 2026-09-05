import type { ReactNode } from 'react';

export const adminInputClassName =
  'w-full rounded-lg border border-[#C5A059]/80 bg-white px-3 py-2.5 text-sm text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25 disabled:opacity-60';

export default function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#082D58]">
        {label}
      </label>
      {children}
    </div>
  );
}
