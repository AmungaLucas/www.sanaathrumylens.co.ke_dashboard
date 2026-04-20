'use client';

import Link from 'next/link';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard Error
        </h1>
        {error?.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}
        <p className="text-gray-600 mb-8">
          An unexpected error occurred in the dashboard. Please try again or log out and sign back in.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Try Again
          </button>
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
