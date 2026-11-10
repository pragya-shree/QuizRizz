import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SAFE_BROWSING_WARNING_LIMIT } from './useSafeBrowsing';

interface SafeBrowsingStatusProps {
  violationCount: number;
}

export const SafeBrowsingStatus: React.FC<SafeBrowsingStatusProps> = ({ violationCount }) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
      violationCount > 0
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-blue-200 bg-blue-50 text-blue-900'
    }`}
  >
    <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
    <div>
      <p className="font-semibold">
        Safe browsing is active — {violationCount} of {SAFE_BROWSING_WARNING_LIMIT} warnings used.
      </p>
      <p className="mt-0.5 text-xs">
        Keep this test page active. Leaving it is detected; the next switch after two warnings will
        submit your assessment. Browser restrictions cannot prevent switching tabs.
      </p>
    </div>
  </div>
);
