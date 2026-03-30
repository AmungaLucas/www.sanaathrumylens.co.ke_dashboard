'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to login directly
    window.location.href = '/login';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Redirecting to login...</p>
      </div>
    </div>
  );
}