import { wedding } from '../../theme/wedding';
import { IconCalendar, IconHeart, IconPin } from './icons';

export default function WeddingHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="pt-[clamp(2rem,5vh,3.25rem)] text-center">
      <div className="mx-auto mb-2 w-[8.7rem]" aria-hidden="true">
        <img
          src="/logo-cropped.png"
          alt=""
          className="h-auto w-full"
        />
      </div>
      <h1 className="text-[1.35rem] font-medium leading-snug tracking-[0.01em] text-[#082D58]">
        החתונה של {wedding.coupleShort}
      </h1>
      <div className="mt-3 flex justify-center">
        <p className="inline-flex max-w-full items-center gap-3 whitespace-nowrap rounded-full border border-[#C5A059]/50 bg-[#C5A059]/[0.08] px-[1.15rem] py-[0.55rem]">
          <span className="inline-flex items-center gap-1.5 font-display text-[1.22rem] font-semibold tracking-[0.05em] text-[#082D58]">
            <span className="text-[#C5A059]">
              <IconCalendar />
            </span>
            {wedding.date}
          </span>
          <span className="text-[0.5rem] text-[#C5A059]/80" aria-hidden="true">
            ◆
          </span>
          <span className="inline-flex items-center gap-1.5 text-[1.12rem] font-medium text-[#C5A059]">
            <IconPin />
            {wedding.venue}
          </span>
        </p>
      </div>
      {subtitle ? (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[#6F7C91]">{subtitle}</p>
      ) : null}
      <div className="mx-auto mt-5 mb-[2.15rem] flex max-w-[16.1rem] items-center gap-4">
        <div className="h-px flex-1 bg-[#C5A059]/65" />
        <IconHeart />
        <div className="h-px flex-1 bg-[#C5A059]/65" />
      </div>
    </header>
  );
}
