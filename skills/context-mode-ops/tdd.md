# TDD: Red-Green-Refactor for context-mode

> Embedded from [mattpocock/skills/tdd](https://github.com/mattpocock/skills/tree/main/tdd).
> This is the **mandatory** development methodology for all code changes in context-mode.

## Philosophy

**Core principle**: Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification — "adapter detects platform from env var" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" — treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

## Workflow: Tracer Bullets

### 1. Planning (Before ANY Code)

- [ ] Identify what behaviors need to change or be added
- [ ] List the behaviors to test (not implementation steps)
- [ ] Design interfaces for testability (accept deps, return results, small surface area)
- [ ] Identify opportunities for deep modules (small interface, deep implementation)

### 2. For EACH Behavior (Vertical Slice)

#### RED: Write ONE Failing Test

```
RED:   Write test for this behavior → test MUST fail
```

- Test describes WHAT, not HOW
- Test uses public API only
- Test is independent — doesn't depend on other tests
- Run the test. It MUST fail. If it passes, the test is useless.

#### GREEN: Write Minimal Code to Pass

```
GREEN: Write the minimum code to make the test pass
```

- Don't write "good" code. Write code that passes.
- Don't anticipate future needs.
- Don't refactor yet.
- Run the test. It MUST pass now.

#### REFACTOR: Clean Up (Tests Still Green)

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

### 3. Repeat

Pick the next behavior. Write the next failing test. Repeat until all behaviors are covered.

## Good and Bad Tests — context-mode Examples

### Good Tests (Integration-Style)

```typescript
// GOOD: Tests observable behavior
test("detectPlatform returns claude-code when CLAUDE_PROJECT_DIR is set", () => {
  process.env.CLAUDE_PROJECT_DIR = "/some/path";
  const result = detectPlatform();
  expect(result.platform).toBe("claude-code");
  expect(result.confidence).toBe("high");
});

// GOOD: Tests through public interface
test("FTS5 store indexes content and returns search results", async () => {
  const store = new ContentStore();
  store.index("Test content about FTS5 search", "test-source");
  const results = store.search(["FTS5 search"]);
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].content).toContain("FTS5");
});

// GOOD: Tests behavior, not implementation
test("executor runs JavaScript and returns stdout", async () => {
  const result = await execute("javascript", 'console.log("hello")');
  expect(result.stdout).toContain("hello");
  expect(result.exitCode).toBe(0);
});
```

### Bad Tests (Implementation-Coupled)

```typescript
// BAD: Tests implementation details
test("detectPlatform checks env vars in correct order", () => {
  const spy = jest.spyOn(process.env, "CLAUDE_PROJECT_DIR", "get");
  detectPlatform();
  expect(spy).toHaveBeenCalledBefore(/* next env check */);
});

// BAD: Mocking internal collaborators
test("server handler calls store.index", async () => {
  const mockStore = jest.mock("../store");
  await handleExecute(request);
  expect(mockStore.index).toHaveBeenCalledWith(output, "source");
});

// BAD: Bypasses interface to verify
test("session event is saved", async () => {
  await captureEvent(toolResult);
  const row = db.prepare("SELECT * FROM events").get();
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface instead
test("session event is retrievable after capture", async () => {
  await captureEvent(toolResult);
  const events = await getSessionEvents();
  expect(events).toContainEqual(expect.objectContaining({ tool: "Bash" }));
});
```

## When to Mock

Mock at **system boundaries** only:

- External APIs (GitHub API via `gh`, npm registry)
- File system (for tests that shouldn't create real files)
- Time/randomness
- Network (HTTP responses)

**Don't mock:**

- Your own classes/modules
- Internal collaborators (store, executor, adapters)
- Anything you control

### Designing for Mockability

**Use dependency injection:**

```typescript
// Easy to mock — dependency is passed in
function processHook(input, adapter: HookAdapter) {
  return adapter.formatResponse(input);
}

// Hard to mock — dependency created internally
function processHook(input) {
  const adapter = new ClaudeCodeAdapter();
  return adapter.formatResponse(input);
}
```

**Prefer specific interfaces over generic ones:**

```typescript
// GOOD: Each function independently mockable
const api = {
  getIssue: (id) => gh(`issue view ${id}`),
  getPR: (id) => gh(`pr view ${id}`),
  createRelease: (tag) => gh(`release create ${tag}`),
};

// BAD: Generic function requires conditional mock logic
const api = {
  run: (command) => execSync(`gh ${command}`),
};
```

## Interface Design for Testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them**
   ```typescript
   // Testable
   function buildSnapshot(events, sessionDb: SessionDB) {}
   // Hard to test
   function buildSnapshot(events) {
     const db = new SessionDB();
   }
   ```

2. **Return results, don't produce side effects**
   ```typescript
   // Testable — returns data
   function formatHookResponse(input): HookResponse {}
   // Hard to test — mutates external state
   function writeHookResponse(input): void {
     process.stdout.write(JSON.stringify(response));
   }
   ```

3. **Small surface area** — fewer methods = fewer tests needed, fewer params = simpler setup

## Deep Modules

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden inside
│                     │
└─────────────────────┘
```

When designing, ask:
- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

**context-mode example:**
```typescript
// DEEP: Simple interface, complex implementation
store.search(queries, { source, limit })
// Hides: FTS5 query building, BM25 ranking, chunking, source filtering

// SHALLOW: Exposes implementation
store.buildFTS5Query(terms)
store.rankByBM25(results)
store.filterBySource(results, source)
store.chunkResults(results, limit)
```

## Refactor Candidates

After each TDD cycle, look for:

- **Duplication** → Extract function/class
- **Long methods** → Break into private helpers (keep tests on public interface)
- **Shallow modules** → Combine or deepen
- **Feature envy** → Move logic to where data lives
- **Primitive obsession** → Introduce value objects
- **Existing code** the new code reveals as problematic

## context-mode Test Infrastructure

### Test Runner

```bash
# Full suite
npm test                    # vitest run

# Watch mode (during development)
npm run test:watch          # vitest

# Specific adapter
npx vitest run tests/adapters/opencode.test.ts

# Core modules
npx vitest run tests/core/

# Pattern matching
npx vitest run -t "detectPlatform"
```

### Test File Organization

| Area | Test Location | What to Test |
|------|-------------|--------------|
| Adapters | `tests/adapters/{platform}.test.ts` | Hook format, config paths, env detection |
| Core | `tests/core/routing.test.ts` | Tool routing decisions |
| Core | `tests/core/search.test.ts` | FTS5 search, BM25 ranking |
| Core | `tests/core/server.test.ts` | MCP protocol, tool handlers |
| Core | `tests/core/cli.test.ts` | CLI commands (setup, doctor) |
| Modules | `tests/store.test.ts` | FTS5 indexing, chunking |
| Modules | `tests/executor.test.ts` | Polyglot execution, truncation |
| Modules | `tests/security.test.ts` | Sandbox boundaries |
| Hooks | `tests/hooks/*.test.ts` | Hook lifecycle, formatting |
| Plugins | `tests/plugins/*.test.ts` | Platform-specific plugin behavior |

### Test Isolation

Tests must NOT pollute the real home directory. Use the test setup:

```typescript
// tests/setup-home.ts is auto-loaded by vitest
// It sets HOME to a temp dir
// All tests run in isolation
```

### TDD in Subagents

When Staff Engineers write code in worktrees, they MUST follow TDD:

```
Agent prompt addition:
"Follow TDD strictly:
1. Write a failing test FIRST in tests/{appropriate_dir}/{name}.test.ts
2. Run it: npx vitest run tests/{file} — verify it FAILS
3. Write minimal code to make it pass
4. Run it again — verify it PASSES
5. Refactor if needed
6. Report: RED→GREEN for each behavior"
```
