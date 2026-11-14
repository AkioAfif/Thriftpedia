// White content card with a surface-muted header strip, used on the admin order detail page.
export const detailFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export default function DetailCard({ titleId, title, children, className = '', bodyClassName = 'p-5 sm:p-6' }) {
  return (
    <section aria-labelledby={titleId} className={`overflow-hidden rounded-[20px] border border-[#D9CFC1] bg-white ${className}`}>
      <div className="border-b border-border bg-surface-muted px-5 py-3.5 sm:px-6">
        <h2 id={titleId} className="text-[18px] font-semibold text-text">
          {title}
        </h2>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
