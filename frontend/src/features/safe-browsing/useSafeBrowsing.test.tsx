import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSafeBrowsing } from './useSafeBrowsing';

const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');

afterEach(() => {
  if (originalVisibilityState) {
    Object.defineProperty(document, 'visibilityState', originalVisibilityState);
  } else {
    Reflect.deleteProperty(document, 'visibilityState');
  }
});

describe('useSafeBrowsing', () => {
  it('counts one violation for each time the page loses and regains focus', () => {
    const onViolation = vi.fn();
    const { result } = renderHook(() => useSafeBrowsing({ enabled: true, onViolation }));

    act(() => {
      window.dispatchEvent(new Event('blur'));
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.violationCount).toBe(1);
    expect(onViolation).toHaveBeenCalledExactlyOnceWith(1);

    act(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.violationCount).toBe(2);
    expect(onViolation).toHaveBeenLastCalledWith(2);
  });

  it('does not count focus changes when disabled', () => {
    const onViolation = vi.fn();
    const { result } = renderHook(() => useSafeBrowsing({ enabled: false, onViolation }));

    act(() => window.dispatchEvent(new Event('blur')));

    expect(result.current.violationCount).toBe(0);
    expect(onViolation).not.toHaveBeenCalled();
  });
});
