'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import AuthTabs from './AuthTabs';
import AuthForm from '../ui/AuthForm';
import BrandContext from './BrandContext';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetEmailSent from './ResetEmailSent';
import { useAuth } from '@/context/AuthContext';
import { loginUser, registerUser } from '@/lib/services/authApi';

export default function AuthDialog({
  open,
  onClose,
  context = 'general',
  initialTab = 'login',
  onSubmit,
  onResetPassword,
  resetPreview = false,
  onSuccess,
  hideForgotPassword = false,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [authView, setAuthView] = useState('auth');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const { login } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const titleId = useId();
  const dialogRef = useRef(null);

  // Mengunci scroll halaman dan mengatur fokus saat modal terbuka
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }

      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    dialogRef.current
      ?.querySelector('[data-dialog-close]')
      ?.focus();

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  // Handler untuk permintaan reset password
  async function handleResetRequest(email) {
    setResetError('');

    // Hanya untuk menguji tampilan di auth-preview
    if (resetPreview) {
      setAuthView('sent');
      return;
    }

    // Jangan mengklaim email terkirim jika API belum tersedia
    if (!onResetPassword) {
      setResetError('Password reset is not available yet.');
      return;
    }

    setResetLoading(true);

    try {
      await onResetPassword(email);
      setAuthView('sent');
    } catch {
      setResetError(
        'Unable to process your request. Please try again.'
      );
    } finally {
      setResetLoading(false);
    }
  }

  function backToLogin() {
    setActiveTab('login');
    setAuthView('auth');
    setResetError('');
  }



async function logInWith(values) {
  const response = await loginUser({
    email: values.email,
    password: values.password,
  });

  const { user, token } = response.data;

  if (!user || !token) {
    throw new Error('Invalid login response from server.');
  }

  login(token, user);
  // Dipanggil hanya setelah login sukses (bukan saat dialog ditutup/batal)
  onSuccess?.(user);
  onClose?.();
}

async function handleAuthSubmit({ mode, values }) {
  if (authLoading) return;

  setAuthLoading(true);
  setAuthError('');

  try {
    if (mode === 'register') {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // Dengan onSuccess: langsung login memakai kredensial yang sama
      if (onSuccess) {
        try {
          await logInWith(values);
          return;
        } catch {
          // auto-login gagal: lanjut ke tab Login seperti biasa
        }
      }

      // Setelah berhasil register, pindah ke tab Login
      setActiveTab('login');
      setAuthError('');
      return;
    }

    if (mode === 'login') {
      await logInWith(values);
    }
  } catch (error) {
    setAuthError(
      error.message || 'Authentication failed. Please try again.'
    );
  } finally {
    setAuthLoading(false);
  }
}

  if (!open) return null;

  const isRegister = activeTab === 'register';

  const titles = {
    general: {
      login: 'Welcome back',
      register: 'Create your account',
    },
    checkout: {
      login: 'Log in to continue to checkout',
      register: 'Sign up to continue to checkout',
    },
    wishlist: {
      login: 'Log in to save this piece',
      register: 'Sign up to save this piece',
    },
  };

  const title =
    authView === 'forgot'
      ? 'Reset your password'
      : authView === 'sent'
        ? 'Check your email'
        : (titles[context] ?? titles.general)[activeTab];

  const subtitle =
    authView === 'forgot'
      ? "Enter your email and we'll send you a reset link."
      : authView === 'sent'
        ? null
        : context === 'general'
          ? isRegister
            ? 'A new home for one-of-one finds.'
            : 'Log in to find your next favourite piece.'
          : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 p-margin-mobile"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-32px)] w-full max-w-[520px] flex-col gap-md overflow-hidden rounded-xl bg-surface p-md shadow-level-3 sm:p-8"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start gap-sm">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="headline-sm text-text"
            >
              {title}
            </h2>

            {subtitle && (
              <p className="body-md mt-xs text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            data-dialog-close
            aria-label="Close dialog"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Branding Thriftpedia */}
        {authView === 'auth' && <BrandContext />}

        {/* Tampilan Login dan Sign Up */}
        {authView === 'auth' && (
          <>
            <AuthTabs
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div
              id="auth-tab-panel"
              role="tabpanel"
              aria-labelledby={`auth-tab-${activeTab}`}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <AuthForm
                key={activeTab}
                mode={activeTab}
                formId="auth-dialog-form"
                hideForgotPassword={hideForgotPassword}
                onForgotPassword={() => {
                  setResetError('');
                  setAuthView('forgot');
                }}
                onValidSubmit={(values) => {
                  if (onSubmit) {
                    onSubmit({ mode: activeTab, values });
                  } else {
                    handleAuthSubmit({ mode: activeTab, values });
                  }
                }}
              />
              {authError && (
                <p role="alert" className="body-sm mt-sm text-error">
                  {authError}
                </p>
              )}
            </div>

            <div className="shrink-0 pt-sm">
              <Button
                type="submit"
                form="auth-dialog-form"
                variant="primary"
                size="lg"
                loading={authLoading}
                disabled={authLoading}
                className="h-12 w-full rounded-md shadow-none"
              >
                {isRegister ? 'Create account' : 'Log in'}
              </Button>
            </div>
          </>
        )}

        {/* Tampilan Forgot Password */}
        {authView === 'forgot' && (
          <div className="min-h-0 overflow-y-auto">
            <ForgotPasswordForm
              loading={resetLoading}
              onBack={backToLogin}
              onSubmit={handleResetRequest}
            />

            {resetError && (
              <p role="alert" className="body-sm mt-sm text-error">
                {resetError}
              </p>
            )}
          </div>
        )}

        {/* Tampilan Check Your Email */}
        {authView === 'sent' && (
          <ResetEmailSent onBack={backToLogin} />
        )}
      </section>
    </div>
  );
}
