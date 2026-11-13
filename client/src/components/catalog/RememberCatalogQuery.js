'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { rememberCatalogQuery } from '@/lib/catalogReturn';

export function RememberCatalogQuery() {
  const qs = useSearchParams().toString();
  useEffect(() => {
    rememberCatalogQuery(qs);
  }, [qs]);
  return null;
}
