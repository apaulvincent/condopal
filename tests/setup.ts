/**
 * CondoPal Global Vitest Setup & Test Harness
 * Configures test lifecycle hooks, global mock resets, and custom test matchers.
 */
import { beforeEach, afterEach, vi } from 'vitest';
import { inMemoryStore } from '../src/lib/supabaseMock';

// Ensure in-memory store state is fresh before each test
beforeEach(() => {
  inMemoryStore.reset();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
