'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export function useRequireAuth() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken && !user) {
      router.replace('/login');
    }
  }, [user, accessToken, router]);

  return { user, isAuthenticated: !!accessToken };
}

export function useRedirectIfAuth() {
  const { accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, router]);
}
