import { z } from 'zod';

// Field rules mirror POST /api/orders (server/docs/order-payment-api.md).
export const ADDRESS_FIELDS = ['recipientName', 'phone', 'address', 'city', 'postalCode'];
export const EMPTY_ADDRESS = Object.freeze({ recipientName: '', phone: '', address: '', city: '', postalCode: '' });

// People type "0812-3456 7890"; the API wants digits with an optional leading +.
export const cleanPhone = (value) => value.replace(/[\s-]/g, '');

const required = (label, max) =>
  z.string().trim().min(1, `Enter the ${label}.`).max(max, `Use ${max} characters or fewer.`);

const addressSchema = z.object({
  recipientName: required('recipient’s name', 100),
  phone: z
    .string()
    .transform(cleanPhone)
    .pipe(z.string().regex(/^\+?\d{8,15}$/, 'Enter 8 to 15 digits. You can start with +.')),
  address: required('street address', 500),
  city: required('city', 100),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Enter a 5-digit postal code.'),
});

// All blank -> { address: null } (the order is placed without one).
// Anything typed -> every field must pass; errors are keyed by field name.
export function validateAddress(values) {
  if (ADDRESS_FIELDS.every((key) => !values[key]?.trim())) return { address: null, errors: {} };
  const result = addressSchema.safeParse(values);
  if (result.success) return { address: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { address: null, errors };
}

// One line per part, for display and for the admin "Copy address" button.
export function addressLines(address) {
  if (!address) return [];
  return [address.recipientName, address.phone, address.address, [address.city, address.postalCode].filter(Boolean).join(' ')].filter(
    Boolean
  );
}
