'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('queiroz_token');
    if (token) {
      router.replace('/pendencias');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
