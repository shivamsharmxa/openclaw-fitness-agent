'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useRedirectIfAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
  if (score <= 2) return { label: 'Fair', color: 'bg-orange-400', width: 'w-2/4' };
  if (score <= 3) return { label: 'Good', color: 'bg-yellow-400', width: 'w-3/4' };
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'Name is required';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  return errors;
}

export default function RegisterPage() {
  useRedirectIfAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      toast.success('Account created!');
      router.push('/onboarding');
    } else {
      toast.error(result.error);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            FitCoach
          </Link>
          <p className="mt-2 text-sm text-gray-600">Create your free account</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label="Full name"
                type="text"
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Alex Johnson"
                className={errors.name ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <Input
                label="Email"
                type="email"
                id="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className={errors.email ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <Input
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="At least 8 characters"
                className={errors.password ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {form.password && strength && (
                <div className="mt-1.5">
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`mt-0.5 text-xs font-medium ${
                    strength.label === 'Weak' ? 'text-red-500' :
                    strength.label === 'Fair' ? 'text-orange-500' :
                    strength.label === 'Good' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            <Button type="submit" loading={isLoading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
