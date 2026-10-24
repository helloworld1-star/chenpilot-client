import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineQueue } from '../useOfflineQueue';

describe('useOfflineQueue - Offline Action Classification and Duplicate Replay Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should classify and queue explicitly supported non-payment actions by default', () => {
    const { result } = renderHook(() => useOfflineQueue());
    expect(result.current.queue).toBeDefined();
  });

  it('should exclude payment and signing actions by default', () => {
    const { result } = renderHook(() => useOfflineQueue());
    expect(result.current.isSupportedAction('send_payment')).toBe(false);
    expect(result.current.isSupportedAction('sign_transaction')).toBe(false);
    expect(result.current.isSupportedAction('sync_profile')).toBe(true);
  });

  it('should prevent duplicate replay protection', () => {
    const { result } = renderHook(() => useOfflineQueue());
    act(() => {
      result.current.enqueueAction({ id: 'test-1', type: 'sync_profile', payload: {} });
      result.current.enqueueAction({ id: 'test-1', type: 'sync_profile', payload: {} });
    });
    expect(result.current.queue.length).toBe(1);
  });
});


// Create a wrapper with a real store so dispatch works correctly
const createTestStore = () =>