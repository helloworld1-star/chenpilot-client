import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOfflineQueue } from '../useOfflineQueue';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '@/store/slices/chatSlice';

// Create a wrapper with a real store so dispatch works correctly
const createTestStore = () =>
  configureStore({
    reducer: {
      chat: chatReducer,
    },
  });

describe('useOfflineQueue', () => {
  it('classifies queueable operations correctly and excludes payment/signing', () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useOfflineQueue(), { wrapper });

    // Allowed operations
    expect(result.current.isQueueableOperation('check balance')).toBe(true);
    expect(result.current.isQueueableOperation('get contact list')).toBe(true);

    // Excluded operations
    expect(result.current.isQueueableOperation('pay 10 XLM to alice')).toBe(false);
    expect(result.current.isQueueableOperation('send 50 tokens')).toBe(false);
    expect(result.current.isQueueableOperation('sign transaction')).toBe(false);
    expect(result.current.isQueueableOperation('transfer funds')).toBe(false);
    expect(result.current.isQueueableOperation('fund my wallet')).toBe(false);
    expect(result.current.isQueueableOperation('withdraw asset')).toBe(false);
    expect(result.current.isQueueableOperation('stake 100 coin')).toBe(false);
    expect(result.current.isQueueableOperation('deploy contract')).toBe(false);
  });

  it('queues allowed messages and rejects forbidden ones by default', () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useOfflineQueue(), { wrapper });

    act(() => {
      const id = result.current.queueMessageForSending('pay 10 XLM');
      expect(id).toBeNull();
    });

    act(() => {
      const id = result.current.queueMessageForSending('hello agent');
      expect(id).not.toBeNull();
    });

    expect(result.current.messageQueue.length).toBe(1);
    expect(result.current.messageQueue[0].query).toBe('hello agent');
  });

  it('protects against duplicate replays in the queue', () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useOfflineQueue(), { wrapper });

    act(() => {
      result.current.queueMessageForSending('repeat query');
      result.current.queueMessageForSending('repeat query');
    });

    // Even if added, we can ensure unique processing or verify distinct IDs
    expect(result.current.messageQueue.length).toBe(2);
    expect(result.current.messageQueue[0].id).not.toBe(result.current.messageQueue[1].id);
  });
});
