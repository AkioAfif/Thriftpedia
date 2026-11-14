import { cn } from '@/lib/utils';

const WAVES = {
  // Bottom edge of the hero into the canvas.
  hero: { viewBox: '0 0 1200 120', d: 'M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z' },
  // Canvas biting into the top / bottom of the How it works band (24px amplitude).
  bandTop: { viewBox: '0 0 1200 24', d: 'M0,0 C300,24 900,0 1200,24 L1200,0 L0,0 Z' },
  bandBottom: { viewBox: '0 0 1200 24', d: 'M0,0 C300,24 900,0 1200,24 L1200,24 L0,24 Z' },
  // Top edge of the footer.
  footer: { viewBox: '0 0 1200 48', d: 'M0,0 C300,32 800,-12 1200,24 L1200,48 L0,48 Z' },
};

// Decorative filled wave: no stroke, display:block so no baseline gap appears under it.
export function WaveDivider({ variant = 'hero', className, fill = 'currentColor' }) {
  const wave = WAVES[variant];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={wave.viewBox}
      preserveAspectRatio="none"
      className={cn('pointer-events-none block w-full', className)}
    >
      <path d={wave.d} fill={fill} stroke="none" />
    </svg>
  );
}
