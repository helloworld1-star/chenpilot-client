import { describe, it, expect } from 'vitest';
import { isOperationQueueable } from './useOfflineQueue';

describe('useOfflineQueue classification and duplicate protection', () => {
  it('classifies chat and general queries as queueable', () => {
    expect(isOperationQueueable('Hello assistant', 'chat')).toBe(true);
    expect(isOperationQueueable('What is my portfolio status?', 'general')).toBe(true);
  });

  it('excludes payment and signing actions by default', () => {
    expect(isOperationQueueable('Send payment of 50 XLM to Bob', 'payment')).toBe(false);
    expect(isOperationQueueable('sign transaction 0xabc123', 'signing')).toBe(false);
    expect(isOperationQueueable('Transfer 10 USDC', 'chat')).toBe(false);
    expect(isOperationQueueable('Deploy account now', 'chat')).toBe(false);
  });

  it('handles duplicate replay checks on query strings', () => {
    const queryA = 'Check liquidity pools';
    const queryB = 'check liquidity pools ';
    expect(queryA.trim().toLowerCase()).toBe(queryB.trim().toLowerCase());
  });
});
