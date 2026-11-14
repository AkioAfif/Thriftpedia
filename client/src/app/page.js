import { Suspense } from 'react';
import { getLandingData } from '@/lib/services/landingService';
import { Hero } from '@/components/landing/Hero';
import { ValueTags } from '@/components/landing/ValueTags';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { NewArrivals } from '@/components/landing/NewArrivals';
import { CategoryBento } from '@/components/landing/CategoryBento';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { LandingSkeleton } from '@/components/landing/LandingSkeleton';

export const metadata = {
  title: 'Thriftpedia — One piece. One owner.',
  description:
    'Pre-loved fashion where every piece is unique and available once. Browse handpicked vintage and timeless essentials.',
};

// Each data section fails on its own: static copy stays, the data part is hidden.
async function LandingContent() {
  const { hero, arrivals, categoryPhotos } = await getLandingData();

  return (
    <>
      <Hero products={hero.items} />
      <ValueTags />
      <HowItWorks />
      {arrivals.ok && <NewArrivals products={arrivals.items} />}
      <CategoryBento photos={categoryPhotos} />
      <CtaBanner products={hero.items} />
    </>
  );
}

export default function HomePage() {
  return (
    <main className="flex-1 overflow-x-clip">
      <Suspense fallback={<LandingSkeleton />}>
        <LandingContent />
      </Suspense>
    </main>
  );
}
