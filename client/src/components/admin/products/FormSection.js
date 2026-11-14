// Form card: a solid coloured header strip with a step number, white body, #D9CFC1 border.
export default function FormSection({ step, title, titleId, tone, aside, children }) {
  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-2xl border border-[#D9CFC1] bg-white">
      <div className={`flex items-center gap-3 border-b border-[#D9CFC1] px-5 py-3.5 sm:px-6 ${tone}`}>
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#B5532E] text-sm font-semibold text-white"
        >
          {step}
        </span>
        <h2 id={titleId} className="min-w-0 flex-1 text-[18px] font-semibold text-[#2B2118]">
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
