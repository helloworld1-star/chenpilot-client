import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineQueue } from '../useOfflineQueue';
import apiService from '@/services/api';

vi.mock('@/store', () => ({
  useAppDispatch: () => vi.fn((action) => {
    if (typeof action === 'function') {
      return {
        unwrap: () => Promise.resolve('mocked_result'),
      };
    }
    return action;
  }),
  useAppSelector: (selector: any) => selector({
    chat: {
      isOnline: true,
      messageQueue: [],
    },
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useOfflineQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('classifies queueable vs non-queueable operations correctly', () => {
    const { result } = renderHook(() => useOfflineQueue());

    expect(result.current.isQueueableOperation('Help me understand pool statistics')).toBe(true);
    expect(result.current.isQueueableOperation('What is the current gas price?')).toBe(true);

    expect(result.current.isQueueableOperation('Send 10 XLM to Alice')).toBe(false);
    expect(result.current.isQueueableOperation('Sign transaction payload')).toBe(false);
    expect(result.current.isQueueableOperation('Pay 50 USDC for prompt')).toBe(false);
    expect(result.current.isQueueableOperation('Stake 100 STRK')).toBe(false);
  });

  it('excludes payment and signing actions from queueing by default', () => {
    const { result } = renderHook(() => useOfflineQueue());

    let queuedId;
    act(() => {
      queuedId = result.current.queueMessageForSending('Transfer 5 XLM');
    });

    expect(queuedId).toBeNull();
  });

  it('allows queueing non-payment queries', () => {
    const { result } = renderHook(() => useOfflineQueue());

    let queuedId;
    act(() => {
      queuedId = result.current.queueMessageForSending('Explain liquidity pools');
    });

    expect(queuedId).toBeTypeOf('string');
  });

  it('prevents duplicate replay of operations', async () => {
    const spyQuery = vi.spyOn(apiService, 'queryAgent').mockResolvedValue({
      result: {
        success: true,
        data: 'Success',
      },
    });

    const opId = 'op_duplicate_test_123';
    const query = 'Check token price';

    const res1 = await apiService.replayQueuedOperation(opId, query);
    expect(res1.result.success).toBe(true);
    expect(spyQuery).toHaveBeenCalledTimes(1);

    // Second replay with same operationId should hit duplicate protection guard
    const res2 = await apiService.replayQueuedOperation(opId, query);
    expect(res2.result.success).toBe(true);
    expect(res2.result.data).toContain('Operation already replayed');
    expect(spyQuery).toHaveBeenCalledTimes(1); // Call count should not increase

    spyQuery.mockRestore();
  });
});
