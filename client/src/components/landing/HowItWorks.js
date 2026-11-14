import { Reveal } from './Reveal';

const STEPS = [
  { title: 'Browse the catalog', text: 'Explore freshly added unique pieces. Filter by category, fit, or aesthetic.' },
  { title: 'Save to wishlist', text: "Keep your favourites in one spot, but don't wait too long, items are 1 of 1." },
  { title: 'Buy the piece', text: 'Claim ownership before someone else takes it. Simple, secure checkout.' },
  { title: 'Review after it arrives', text: 'Unbox your one-off thrift find and tell the community how it wears.' },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative scroll-mt-20 overflow-hidden bg-primary py-20 text-white md:py-24"
    >
      <div className="relative z-20 mx-auto w-full max-w-[1152px] px-6 py-8">
        <Reveal className="mx-auto mb-16 max-w-[576px] text-center">
          <p className="label-md text-white">Simple process</p>
          <h2 id="how-it-works-title" className="mb-3 mt-2 text-3xl font-bold tracking-tight text-white">
            How it works
          </h2>
          <div aria-hidden="true" className="mx-auto h-1 w-12 rounded-full bg-white/40" />
        </Reveal>

        <div className="relative">
          {/* Connector: vertical on the left for mobile, horizontal behind the numbers from md */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-6 top-6 border-l-2 border-dashed border-white/30 md:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute left-[12%] right-[12%] top-6 hidden border-t-2 border-dashed border-white/30 md:block" />

          <ol className="relative z-10 grid grid-cols-1 items-start gap-10 md:grid-cols-4 md:gap-8">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} index={i} className="flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-primary shadow-level-1 md:mb-4">
                  {i + 1}
                </span>
                <div className="pt-2.5 md:pt-0">
                  <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white md:mx-auto md:max-w-[220px]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
