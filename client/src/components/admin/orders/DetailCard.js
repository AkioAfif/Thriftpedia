// White content card with a #F5F0E8 header strip, used on the admin order detail page.
export const detailFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2';

export default function DetailCard({ titleId, title, children, className = '', bodyClassName = 'p-5 sm:p-6' }) {
  return (
    <section aria-labelledby={titleId} className={`overflow-hidden rounded-[20px] border border-[#D9CFC1] bg-white ${className}`}>
      <div className="border-b border-[#EAE4DA] bg-[#F5F0E8] px-5 py-3.5 sm:px-6">
        <h2 id={titleId} className="text-[18px] font-semibold text-[#2B2118]">
          {title}
        </h2>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
