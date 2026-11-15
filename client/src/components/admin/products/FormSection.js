// Form card: a solid coloured header strip with a step number, white body, var(--border) border.
export default function FormSection({ step, title, titleId, tone, aside, children }) {
  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className={`flex items-center gap-3 border-b border-border px-5 py-3.5 sm:px-6 ${tone}`}>
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
        >
          {step}
        </span>
        <h2 id={titleId} className="min-w-0 flex-1 text-[18px] font-semibold text-text">
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
