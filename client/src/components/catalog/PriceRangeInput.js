'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function PriceRangeInput({
  minPrice,
  maxPrice,
  onApply,
  isMobile = false,
  error: externalError,
}) {
  const [prevMin, setPrevMin] = useState(minPrice);
  const [prevMax, setPrevMax] = useState(maxPrice);
  const [minVal, setMinVal] = useState(
    minPrice !== null && minPrice !== undefined
      ? Number(minPrice).toLocaleString('en-US')
      : ''
  );
  const [maxVal, setMaxVal] = useState(
    maxPrice !== null && maxPrice !== undefined
      ? Number(maxPrice).toLocaleString('en-US')
      : ''
  );
  const [localError, setLocalError] = useState('');

  if (prevMin !== minPrice || prevMax !== maxPrice) {
    setPrevMin(minPrice);
    setPrevMax(maxPrice);
    setMinVal(
      minPrice !== null && minPrice !== undefined
        ? Number(minPrice).toLocaleString('en-US')
        : ''
    );
    setMaxVal(
      maxPrice !== null && maxPrice !== undefined
        ? Number(maxPrice).toLocaleString('en-US')
        : ''
    );
  }

  const parseNumber = (val) => {
    if (!val) return null;
    const clean = String(val).replace(/[^0-9]/g, '');
    if (!clean) return null;
    return parseInt(clean, 10);
  };

  const handleInputChange = (setter) => (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^0-9]/g, '');
    if (!clean) {
      setter('');
      setLocalError('');
      return;
    }
    const num = parseInt(clean, 10);
    setter(num.toLocaleString('en-US'));
    setLocalError('');
  };

  const validateAndApply = () => {
    const min = parseNumber(minVal);
    const max = parseNumber(maxVal);

    if (min !== null && min < 0) {
      setLocalError('Price cannot be negative');
      return;
    }
    if (max !== null && max < 0) {
      setLocalError('Price cannot be negative');
      return;
    }
    if (min !== null && max !== null && min > max) {
      setLocalError('Min price cannot exceed Max price');
      return;
    }

    setLocalError('');
    onApply(min, max);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndApply();
    }
  };

  const error = localError || externalError;

  return (
    <div
      className={cn(
        'space-y-3 pb-6 border-b border-[#E6DDD2]',
        isMobile && 'pb-4'
      )}
    >
      <span className="text-sm font-semibold text-text block font-sans">
        {isMobile ? 'Price' : 'Price Range'}
      </span>
      <div
        className={cn(
          'grid grid-cols-2 gap-3 items-end',
          isMobile && 'flex items-center gap-2'
        )}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {!isMobile && (
            <label
              htmlFor="price-min-input"
              className="text-xs font-medium text-[#5C4D40]"
            >
              Min
            </label>
          )}
          <div className="h-10 bg-white border border-[#E6DDD2] rounded-xl px-3 flex items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all shadow-xs">
            <span className="text-xs text-[#5C4D40] font-sans mr-1.5 shrink-0 font-semibold select-none">
              Rp
            </span>
            <input
              id={isMobile ? 'mobile-price-min' : 'price-min-input'}
              type="text"
              inputMode="numeric"
              aria-label="Minimum price"
              value={minVal}
              onChange={handleInputChange(setMinVal)}
              onBlur={!isMobile ? validateAndApply : undefined}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? 'Min' : '150,000'}
              className="w-full bg-transparent border-0 p-0 text-xs font-sans text-text focus:ring-0 focus:outline-none placeholder:text-[#8C7E72]"
            />
          </div>
        </div>

        {isMobile && (
          <span className="text-xs text-[#5C4D40] font-medium shrink-0">–</span>
        )}

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {!isMobile && (
            <label
              htmlFor="price-max-input"
              className="text-xs font-medium text-[#5C4D40]"
            >
              Max
            </label>
          )}
          <div className="h-10 bg-white border border-[#E6DDD2] rounded-xl px-3 flex items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all shadow-xs">
            <span className="text-xs text-[#5C4D40] font-sans mr-1.5 shrink-0 font-semibold select-none">
              Rp
            </span>
            <input
              id={isMobile ? 'mobile-price-max' : 'price-max-input'}
              type="text"
              inputMode="numeric"
              aria-label="Maximum price"
              value={maxVal}
              onChange={handleInputChange(setMaxVal)}
              onBlur={!isMobile ? validateAndApply : undefined}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? 'Max' : '850,000'}
              className="w-full bg-transparent border-0 p-0 text-xs font-sans text-text focus:ring-0 focus:outline-none placeholder:text-[#8C7E72]"
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-[11px] text-error font-medium pt-1">{error}</p>
      )}
    </div>
  );
}
