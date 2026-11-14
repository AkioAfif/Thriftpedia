import { Reveal } from './Reveal';

const objectText = 'text-sm leading-relaxed text-text';
const objectTitle = 'mb-2 text-2xl font-bold leading-tight text-text';

function HangTag() {
  return (
    <div className="relative flex w-full flex-col items-center">
      <svg aria-hidden="true" width="60" height="48" viewBox="0 0 60 48" fill="none" className="pointer-events-none relative z-10 -mb-2 block">
        <path d="M30 46 C 14 36, 12 12, 30 4 C 48 12, 46 36, 30 46" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div
        className="flex w-full flex-col items-center bg-badge-warning px-7 pb-8 pt-4 text-center shadow-level-1"
        style={{ clipPath: 'polygon(36px 0%, calc(100% - 36px) 0%, 100% 36px, 100% 100%, 0% 100%, 0% 36px)' }}
      >
        <div aria-hidden="true" className="mb-4 size-5 rounded-full border-2 border-text/25 bg-canvas" />
        <p className="mb-3 text-[64px] font-semibold leading-none tracking-tight text-primary">1/1</p>
        <div aria-hidden="true" className="mb-4 h-0.5 w-12 bg-text/15" />
        <h3 className={objectTitle}>One of a kind</h3>
        <p className={objectText}>Every piece is unique. Stock is always one.</p>
      </div>
    </div>
  );
}

function Ticket() {
  return (
    <div className="flex w-full rounded-lg bg-secondary-tint shadow-level-1">
      <div className="flex flex-1 flex-col justify-between p-6 pr-4">
        <div>
          <span className="mb-4 inline-block rounded bg-text/8 px-2.5 py-1 font-metadata text-[11px] font-semibold uppercase tracking-widest text-text">
            No. 001
          </span>
          <h3 className={objectTitle}>First come, first served</h3>
          <p className={objectText}>When two people want the same piece, only one gets it.</p>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-text/10 pt-3 font-metadata text-[11px]">
          <span className="font-semibold tracking-wider text-primary-hover">ADMIT ONE</span>
          <span className="text-text-secondary">THRIFTPEDIA</span>
        </div>
      </div>
      <div className="flex w-12 flex-col items-center justify-center border-l-2 border-dashed border-text/30 py-6">
        <span className="rotate-180 font-metadata text-[10px] font-bold tracking-widest text-text-secondary [writing-mode:vertical-rl]">
          CLAIM STUB
        </span>
      </div>
    </div>
  );
}

const LABEL_ROWS = [
  ['GARMENT', 'Size M'],
  ['CONDITION', 'Like New'],
  ['PRICE', 'Rp 90.000'],
];

function StitchLabel() {
  return (
    <div className="w-full rounded-md border-2 border-dashed border-text/40 bg-badge-info p-6 shadow-level-1">
      <dl className="mb-5 font-metadata text-xs">
        {LABEL_ROWS.map(([term, value]) => (
          <div key={term} className="flex items-center justify-between border-b border-text/15 py-1.5">
            <dt className="font-medium text-text-secondary">{term}</dt>
            <dd className="font-semibold text-text">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className={objectTitle}>Honestly described</h3>
      <p className={objectText}>Clear photos, size, and condition for every piece.</p>
    </div>
  );
}

const OBJECTS = [
  { key: 'tag', node: <HangTag />, width: 'max-w-[340px]', tilt: '-rotate-4', sway: true },
  { key: 'ticket', node: <Ticket />, width: 'max-w-[320px] md:translate-y-8', tilt: 'rotate-3', sway: true },
  { key: 'label', node: <StitchLabel />, width: 'max-w-[360px]', tilt: '-rotate-2', sway: false },
];

export function ValueTags() {
  return (
    <section aria-labelledby="values-title" className="relative overflow-hidden bg-canvas pb-24 pt-20 md:pb-36 md:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[220px] w-[85%] max-w-[1024px] -translate-x-1/2 -translate-y-1/2 bg-badge-warning opacity-35 blur-[60px]"
        style={{ borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <Reveal className="mx-auto mb-14 max-w-[576px] text-center">
          <p className="label-md text-primary">Why Thriftpedia</p>
          <h2 id="values-title" className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-text sm:text-3xl md:text-[40px]">
            Every piece has one owner.
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[15px] leading-relaxed text-text-secondary sm:text-base">
            Each item is unique, available once, and described honestly.
          </p>
          <div aria-hidden="true" className="mx-auto mt-4 h-[3px] w-12 rounded-full bg-primary" />
        </Reveal>

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-3 md:gap-8">
          {OBJECTS.map((object, i) => (
            <Reveal key={object.key} index={i} className="flex justify-center">
              <div className={`w-full ${object.width} ${object.tilt}`}>
                <div className={object.sway ? 'landing-sway' : undefined}>{object.node}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
