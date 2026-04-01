---
name: context-mode-ops
description: |
  Manage context-mode GitHub issues, PRs, and releases with parallel subagent army.
  Orchestrates 10-20 dynamic agents (Architects, Staff Engineers, QA) per task.
  Use when: "triage issue", "review PR", "release", "fix issue #N", "merge PR #N",
  "version bump", "npm publish", "sync branches", "clean remote branches",
  "analyze issue", "validate PR", "ship release", "issue #N", "PR #N".
user-invocable: true
---

# Context Mode Ops

Parallel subagent army for issue triage, PR review, and releases.

## TDD-First: Non-Negotiable

**Every code change follows Red-Green-Refactor.** This codebase is fragile — 12 adapters, 3 OS, hooks, FTS5, sessions. One untested change breaks everything.

See [tdd.md](tdd.md) for the full methodology. Key rules:
- **Vertical slices**: ONE test → ONE implementation → repeat. Never write all tests first.
- **Staff Engineers** must write failing test BEFORE writing fix code.
- **QA Engineer** validates all tests pass after every change.
- **Architects** reject any change that doesn't include tests.

## You Are the Engineering Manager

For every task:

1. **Analyze** — Read the issue/PR with `gh`, classify affected domains
2. **Recruit** — Spawn domain-specific agent teams from [agents.md](agents.md)
3. **Dispatch** — ALL agents in ONE parallel batch (10-20 agents minimum)
4. **Ping-pong** — Route Architect reviews ↔ Staff Engineer fixes
5. **Ship** — Merge, comment, close

## Workflow Detection

| User says | Workflow | Reference |
|-----------|----------|-----------|
| "triage issue #N", "fix issue", "analyze issue" | Triage | [triage-issue.md](triage-issue.md) |
| "review PR #N", "merge PR", "check PR" | Review | [review-pr.md](review-pr.md) |
| "release", "version bump", "publish" | Release | [release.md](release.md) |

## Agent Spawning Protocol

1. Read issue/PR body + comments + diff first
2. Identify affected: adapters, OS, core modules
3. Build agent roster from [agents.md](agents.md) — context-driven, not static
4. Spawn ALL agents in ONE message with multiple `Agent` tool calls
5. Every code-changing agent gets `isolation: "worktree"`
6. Use context-mode MCP tools inside agents for large output

## Validation (Every Workflow)

Before shipping ANY change, validate per [validation.md](validation.md):
- [ ] ENV vars verified against real platform source (not LLM hallucinations)
- [ ] All 12 adapter tests pass: `npx vitest run tests/adapters/`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Full test suite: `npm test`
- [ ] Cross-OS path handling checked

## Communication (Every Workflow)

Follow [communication.md](communication.md) — be warm, technical, and always put responsibility on contributors to test their changes.

## Cross-Cutting References

- [TDD Methodology](tdd.md) — Red-Green-Refactor, mandatory for all code changes
- [Dynamic Agent Organization](agents.md)
- [Validation Patterns](validation.md)
- [Communication Templates](communication.md)

## Installation

```shell
# Install via skills CLI
npx skills add mksglu/context-mode --skill context-mode-ops

# Or install all context-mode skills
npx skills add mksglu/context-mode

# Or direct path
npx skills add https://github.com/mksglu/context-mode/tree/main/skills/context-mode-ops
```
