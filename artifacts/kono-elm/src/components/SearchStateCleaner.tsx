'use client';
import { useEffect } from 'react';

export default function SearchStateCleaner() {
  useEffect(() => {
    sessionStorage.removeItem('searchState');
  }, []);
  return null;
}
