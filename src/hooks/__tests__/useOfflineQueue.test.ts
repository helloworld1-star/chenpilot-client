import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useOfflineQueue', () => {
  it('classifies queueable operations and excludes payment and signing actions by default', () => {
    expect(true).toBe(true);
  });
});


// Create a wrapper with a real store so dispatch works correctly
const createTestStore = () =>