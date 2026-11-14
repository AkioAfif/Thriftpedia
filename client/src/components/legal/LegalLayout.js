import { LAST_UPDATED } from '@/lib/legalContent';
import { PageHeader } from './PageHeader';
import { LegalToc } from './LegalToc';
import { RichText } from './EmailLink';

// Terms / Privacy layout: header, then a sticky table of contents (left) and the text
// (right, max 680px) on desktop; on smaller screens the contents become a dropdown.
export function LegalLayout({ title, crumb, sections }) {
  const tocSections = sections.map(({ id, title: sectionTitle }) => ({ id, title: sectionTitle }));

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-24 pt-6 sm:px-8 lg:px-28">
      <PageHeader title={title} crumb={crumb} subtitle={`Last updated: ${LAST_UPDATED}`} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-[240px_minmax(0,680px)] lg:gap-[120px]">
        <aside>
          <LegalToc sections={tocSections} />
        </aside>

        <div className="min-w-0 space-y-10">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
              <h2 id={`${section.id}-title`} className="text-2xl font-semibold leading-tight text-text">
                {i + 1}. {section.title}
              </h2>
              {section.body.map((paragraph, j) => (
                <p key={j} className="mt-4 text-base leading-[1.7] text-text">
                  <RichText text={paragraph} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
