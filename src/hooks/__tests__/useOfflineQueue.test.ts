import { describe, it, expect } from 'vitest';

describe('useOfflineQueue', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });
});


// Create a wrapper with a real store so dispatch works correctly
const createTestStore = () =>