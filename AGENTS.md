# 🤖 Agent Coordination Protocol & Shared Context

> **Note to all Antigravity & AI Agents:**
> Multiple agents work concurrently and sequentially on this codebase. To avoid regressions, conflicting edits, and context loss, you **MUST** follow this protocol on every invocation.

---

## 1. 🔄 Read-First (Sync In)
Before modifying code or planning implementation details:
1. **Check Active Tasks & Locks**: Read [ACTIVE_TASKS.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ACTIVE_TASKS.md) to see what tasks are currently in progress and which files are claimed.
2. **Review System Architecture**: Read [ARCHITECTURE.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ARCHITECTURE.md) to understand module boundaries, data formats, and patterns.
3. **Check Recent Decisions**: Scan the top entries of [DEV_LOG.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/DEV_LOG.md) for recent gotchas, schema modifications, or handoff notes.
4. **Claim Your Work**: Register your active task and claimed files under the **Active Work & Claims** table in [ACTIVE_TASKS.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ACTIVE_TASKS.md).

---

## 2. 🛡️ Conflict Prevention Rules
- **Respect File Claims**: If another agent or session marked a file as `IN_PROGRESS`, do not perform large breaking refactors on that file without user guidance.
- **Maintain Documentation Integrity**: Preserve all existing comments and docstrings unrelated to your changes.
- **Preserve Interfaces**: Keep core data structures in `data/` and global utilities (like [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js) or `teamhash` encoders) backward-compatible.

---

## 3. ✍️ Write-Last (Sync Out)
When you complete or pause your task:
1. **Update Task Board**: Update [ACTIVE_TASKS.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ACTIVE_TASKS.md) (mark your task as `COMPLETED` or update notes if handing off).
2. **Append to Dev Log**: Add a concise entry to [DEV_LOG.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/DEV_LOG.md):
   - **Date & Goal**: Brief description of the task.
   - **Files Touched**: Clickable file links.
   - **Architectural Notes / Gotchas**: Decisions that future agents need to be aware of.
