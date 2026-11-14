import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading reset password...</p>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}