'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Fades + lifts its children (translateY 24px -> 0, 600ms) the first time 15% of it is visible.
// `index` staggers siblings by 80ms. The hidden start state lives in globals.css under
// `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, so without
// JS or with reduced motion the content is simply visible.
export function Reveal({ as: Tag = 'div', index = 0, className, style, children, ...props }) {
  const ref = useRef(null);

  // The flag is written straight to the DOM (no re-render); React never changes the prop.
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const show = () => {
      node.dataset.reveal = 'shown';
    };
    if (typeof IntersectionObserver === 'undefined') {
      show();
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal="pending"
      className={cn('landing-reveal', className)}
      style={{ ...style, '--reveal-delay': `${index * 80}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}
