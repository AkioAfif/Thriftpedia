import { CONTACT_EMAIL } from '@/lib/legalContent';
import { cn } from '@/lib/utils';

export function EmailLink({ className }) {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className={cn(
        'break-all rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      {CONTACT_EMAIL}
    </a>
  );
}

// Renders a paragraph from legalContent, swapping `{email}` for the mailto link.
export function RichText({ text }) {
  const parts = text.split('{email}');
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <EmailLink />}
    </span>
  ));
}
