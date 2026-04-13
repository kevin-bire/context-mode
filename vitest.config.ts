import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    // Native addons (better-sqlite3) can segfault in worker_threads during
    // process cleanup. Use forks on all platforms for stable isolation.
    pool: "forks",
    // Cap parallel workers to prevent fork exhaustion (#258).
    // Tests that spawnSync + better-sqlite3 cause worker SIGKILL under
    // unlimited parallelism. Benchmarked: 3 workers = 2.8x speedup with
    // near-zero crashes (vs unlimited = 3.7x but 6-7 worker kills/run).
    maxWorkers: 3,
    // Hook subprocess tests (spawnSync + better-sqlite3 native addon) can
    // fail intermittently under parallel load on CI.  Retry once to absorb
    // transient resource-contention failures without masking real regressions.
    // Only enable retry on CI to avoid slowing down local dev.
    retry: process.env.CI ? 2 : 0,
  },
});
