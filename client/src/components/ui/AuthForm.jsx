'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthInput from '@/components/ui/AuthInput';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required'),
    email: z.email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must contain at least 8 characters')
      .regex(/\d/, 'Password must include a number'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm your password'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export default function AuthForm({
  mode = 'login',
  formId = 'auth-form',
  onValidSubmit,
  onForgotPassword,
}) {
  const isRegister = mode === 'register';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      isRegister ? registerSchema : loginSchema
    ),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: isRegister
      ? {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        }
      : {
          email: '',
          password: '',
        },
  });

  const handleValid = (values) => {
    // Slicing UI: belum mengirim request ke backend.
    onValidSubmit?.(values);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(handleValid)}
      noValidate
      className="flex w-full flex-col gap-md"
    >
      {/* Full name - hanya untuk Sign Up */}
      {isRegister && (
        <AuthInput
          label="Full name"
          placeholder="Your full name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
      )}

      {/* Email */}
      <AuthInput
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password */}
      <AuthInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete={
          isRegister ? 'new-password' : 'current-password'
        }
        hint={
          isRegister
            ? 'At least 8 characters, including a number'
            : undefined
        }
        error={errors.password?.message}
        {...register('password')}
      />

      {/* Confirm password - hanya untuk Sign Up */}
      {isRegister ? (
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      ) : (
        /* Forgot password - hanya untuk Log in */
        <button
          type="button"
          onClick={onForgotPassword}
          className="w-fit body-md font-semibold text-text hover:underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          Forgot password?
        </button>
      )}

      {/* Area untuk pesan feedback */}
      <div
        aria-live="polite"
        className="min-h-[72px]"
      />
    </form>
  );
}