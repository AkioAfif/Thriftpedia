'use client';

import { Button } from '@/components/ui/Button';

export default function ResetEmailSent({ onBack }) {
  return (
    <div className="flex flex-col gap-lg">
      <p className="body-md text-text-secondary">
        If this email has an account, you&apos;ll receive a password
        reset link.
      </p>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onBack}
        className="h-12 w-full rounded-md shadow-none"
      >
        Back to Login
      </Button>
    </div>
  );
}