export function IconQuestion() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/85 text-[#B88D3E]">
      <span className="text-xl font-light leading-none">?</span>
    </span>
  );
}

export function IconPeople() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/85 text-[#B88D3E]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="9" cy="8" r="2.1" />
        <circle cx="15.2" cy="8.6" r="1.7" />
        <path d="M4.6 17.8c.5-2.8 2.3-4.3 4.4-4.3 2.1 0 3.9 1.5 4.4 4.3" strokeLinecap="round" />
        <path d="M13.2 13.8c1.5-.3 3.3 0 4.6 1.3.6.6 1 1.5 1.2 2.7" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function IconChild() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/85 text-[#B88D3E]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="7.2" />
        <circle cx="9.4" cy="10.8" r="0.7" fill="currentColor" stroke="none" />
        <circle cx="14.6" cy="10.8" r="0.7" fill="currentColor" stroke="none" />
        <path d="M9.4 14.4c.7 1.1 1.6 1.6 2.6 1.6s1.9-.5 2.6-1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function IconWheat() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/85 text-[#B88D3E]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 20V8" strokeLinecap="round" />
        <path d="M12 9.2c-1.8-1.2-3.5-1-4.7.2 1.4 1.4 3.1 1.5 4.7-.2Z" />
        <path d="M12 9.2c1.8-1.2 3.5-1 4.7.2-1.4 1.4-3.1 1.5-4.7-.2Z" />
        <path d="M12 12.8c-1.8-1.2-3.5-1-4.7.2 1.4 1.4 3.1 1.5 4.7-.2Z" />
        <path d="M12 12.8c1.8-1.2 3.5-1 4.7.2-1.4 1.4-3.1 1.5-4.7-.2Z" />
        <path d="M12 6.6c-1.1-1.2-2.2-1.3-3.1-.5 1 .9 2 .9 3.1.5Z" />
        <path d="M12 6.6c1.1-1.2 2.2-1.3 3.1-.5-1 .9-2 .9-3.1.5Z" />
      </svg>
    </span>
  );
}

export function IconCheck({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeart() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-[#C5A059]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function IconCalendar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.05rem] w-[1.05rem] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2" />
      <path d="M8 3.6v3.4M16 3.6v3.4M3.6 10h16.8" />
    </svg>
  );
}

export function IconPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.05rem] w-[1.05rem] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-6.4-5.6-6.4-10.4a6.4 6.4 0 1 1 12.8 0C18.4 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.6" r="2.15" />
    </svg>
  );
}

export function IconPlane() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#D6B46F]" fill="none" stroke="currentColor" strokeWidth="1.35">
      <path d="M21 4 3.5 11.2l7.4 1.7L14 21 21 4Z" strokeLinejoin="round" />
      <path d="m10.9 12.9 3.7-3.8" strokeLinecap="round" />
    </svg>
  );
}
