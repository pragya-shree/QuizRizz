import { useEffect, useRef, useState } from 'react';

export interface UseSafeBrowsingOptions {
  enabled: boolean;
  onViolation: (violationCount: number) => void;
}

export const SAFE_BROWSING_WARNING_LIMIT = 2;

export function useSafeBrowsing({ enabled, onViolation }: UseSafeBrowsingOptions) {
  const [violationCount, setViolationCount] = useState(0);
  const violationCountRef = useRef(0);
  const isAwayRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  useEffect(() => {
    if (!enabled) return;

    const recordViolation = () => {
      if (isAwayRef.current) return;

      isAwayRef.current = true;
      violationCountRef.current += 1;
      setViolationCount(violationCountRef.current);
      onViolationRef.current(violationCountRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation();
      } else {
        isAwayRef.current = false;
      }
    };

    const handleFocus = () => {
      if (document.visibilityState !== 'hidden') {
        isAwayRef.current = false;
      }
    };

    window.addEventListener('blur', recordViolation);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', recordViolation);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isAwayRef.current = false;
    };
  }, [enabled]);

  return { violationCount };
}
