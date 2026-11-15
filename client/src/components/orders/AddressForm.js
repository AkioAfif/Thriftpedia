'use client';

import { useId } from 'react';

// The five delivery-address fields, shared by checkout and the order page's address dialog.
// Validation lives in lib/shippingAddress.js; this only renders values and errors.

// 44px fields: 1.5px #D9CFC1 edge; focus = terracotta edge + #FBE6DC ring; error = #B3402A edge.
// 16px text below sm so mobile browsers don't zoom into the field.
const fieldBase =
  'w-full rounded-xl border-[1.5px] bg-white px-3 text-base text-[#2B2118] placeholder:text-[#7A6D61] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#B5532E] focus:shadow-[0_0_0_3px_#FBE6DC] disabled:cursor-not-allowed disabled:bg-[#F5F0E8] disabled:text-[#6F6358] motion-reduce:transition-none sm:text-sm';
const fieldClass = (error) => `${fieldBase} ${error ? 'border-[#B3402A]' : 'border-[#D9CFC1]'}`;

const ADDRESS_INPUTS = {
  recipientName: { label: 'Recipient name', autoComplete: 'name', maxLength: 100 },
  phone: { label: 'Phone number', autoComplete: 'tel', inputMode: 'tel', type: 'tel', maxLength: 20, hint: 'Digits only, e.g. 0812 3456 7890.' },
  address: { label: 'Street address', autoComplete: 'street-address', maxLength: 500, multiline: true },
  city: { label: 'City', autoComplete: 'address-level2', maxLength: 100 },
  postalCode: { label: 'Postal code', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 5 },
};

function AddressField({ name, value, error, onChange, disabled, idBase, className = '' }) {
  const spec = ADDRESS_INPUTS[name];
  const id = `${idBase}-${name}`;
  const describedBy = error ? `${id}-error` : spec.hint ? `${id}-hint` : undefined;
  const common = {
    id,
    name,
    value,
    disabled,
    autoComplete: spec.autoComplete,
    inputMode: spec.inputMode,
    maxLength: spec.maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    onChange: (event) => onChange(name, event.target.value),
  };
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-[#2B2118]">
        {spec.label}
      </label>
      <div className="mt-1.5">
        {spec.multiline ? (
          <textarea {...common} rows={3} className={`${fieldClass(error)} block min-h-[88px] resize-y py-2.5`} />
        ) : (
          <input {...common} type={spec.type ?? 'text'} className={`${fieldClass(error)} h-11`} />
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 break-words text-[13px] font-medium text-[#B3402A]">
          {error}
        </p>
      ) : (
        spec.hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-[#6F6358]">
            {spec.hint}
          </p>
        )
      )}
    </div>
  );
}

// Below sm one column; from sm name + phone and city + postal code pair up, the street spans both.
// Every input carries its field name, so a caller can focus the first invalid one by [name="..."].
export function AddressForm({ values, errors = {}, onChange, disabled = false }) {
  const idBase = useId();
  const field = (name, className) => (
    <AddressField
      name={name}
      value={values[name]}
      error={errors[name]}
      onChange={onChange}
      disabled={disabled}
      idBase={idBase}
      className={className}
    />
  );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {field('recipientName')}
      {field('phone')}
      {field('address', 'sm:col-span-2')}
      {field('city')}
      {field('postalCode')}
    </div>
  );
}
