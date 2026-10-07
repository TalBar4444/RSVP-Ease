const circleIconClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/85 text-[#B88D3E]';

export function IconQuestion() {
  return (
    <span className={circleIconClass} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9.2 9a2.8 2.8 0 1 1 4.4 2.3c-.8.5-1.4 1.15-1.4 2.2" />
        <circle cx="12.2" cy="17.15" r="0.95" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function IconFamily() {
  return (
    <span className={circleIconClass} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <g transform="translate(0 0.7)">
          <circle cx="7.4" cy="7.1" r="1.9" />
          <path d="M3.8 17.8c.4-2.6 1.9-4 3.6-4s3.2 1.4 3.6 4" strokeLinecap="round" />
          <circle cx="16.6" cy="7.1" r="1.9" />
          <path d="M13 17.8c.4-2.6 1.9-4 3.6-4s3.2 1.4 3.6 4" strokeLinecap="round" />
          <circle cx="12" cy="9.6" r="1.55" />
          <path d="M9.7 17.8c.3-1.8 1.2-2.7 2.3-2.7s2 0.9 2.3 2.7" strokeLinecap="round" />
        </g>
      </svg>
    </span>
  );
}

export function IconWheat() {
  return (
    <span className={circleIconClass} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.45">
        <path d="M12 19.4V5.8" strokeLinecap="round" />
        <path d="M12 7.3c-1.75-1.1-3.4-.95-4.55.3 1.35 1.3 3.05 1.45 4.55-.3Z" />
        <path d="M12 7.3c1.75-1.1 3.4-.95 4.55.3-1.35 1.3-3.05 1.45-4.55-.3Z" />
        <path d="M12 10.7c-1.75-1.1-3.4-.95-4.55.3 1.35 1.3 3.05 1.45 4.55-.3Z" />
        <path d="M12 10.7c1.75-1.1 3.4-.95 4.55.3-1.35 1.3-3.05 1.45-4.55-.3Z" />
        <path d="M12 14.1c-1.75-1.1-3.4-.95-4.55.3 1.35 1.3 3.05 1.45 4.55-.3Z" />
        <path d="M12 14.1c1.75-1.1 3.4-.95 4.55.3-1.35 1.3-3.05 1.45-4.55-.3Z" />
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
