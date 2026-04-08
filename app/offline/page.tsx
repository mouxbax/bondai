'use client';

import { useState } from 'react';

export default function OfflinePage() {
  const [isReloading, setIsReloading] = useState(false);

  const handleRetry = () => {
    setIsReloading(true);
    window.location.reload();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 safe-area-bottom">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* BondAI Logo / Branding */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[#1d9e75] flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">You're Offline</h1>
          <p className="text-lg text-gray-500">
            It looks like you've lost your internet connection. Don't worry, we'll be here when you're back online.
          </p>
        </div>

        {/* Visual indicator */}
        <div className="py-8">
          <svg
            className="w-16 h-16 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.111 16.332a9 9 0 100-16.664"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3l18 18"
            />
          </svg>
        </div>

        {/* Try Again Button */}
        <button
          onClick={handleRetry}
          disabled={isReloading}
          className="w-full bg-[#1d9e75] hover:bg-[#16815f] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          {isReloading ? 'Reconnecting...' : 'Try Again'}
        </button>

        {/* Help text */}
        <p className="text-sm text-gray-400">
          Check your connection and try again
        </p>
      </div>
    </div>
  );
}
