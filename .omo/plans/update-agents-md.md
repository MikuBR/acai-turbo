---
slug: update-agents-md
status: approved
intent: clear
review_required: true
pending-action: execute .omo/plans/update-agents-md.md via $start-work
approach: Update root AGENTS.md (fix stale refs, update roadmap context), update README.md roadmap to reflect completed issues.
---

# Plan: update-agents-md

## TL;DR (For humans)

This plan updates `AGENTS.md` to fix a stale file reference and updates `README.md` to reflect that iFood integration and PDF financial reports are already implemented.

## Findings (cited - path:lines)

- Root AGENTS.md (81 lines) exists, comprehensive, and largely accurate.
- Stale reference: AGENTS.md:16 says `src/store/useStore.js`; actual file is `src/store/useStore.ts` (verified via `package.json` dependency `typescript` and `glob src/store/*`).
- `README.md` Roadmap:
    - #7 — iFood no delivery: **CLOSED AND IMPLEMENTED**. Verified by `main.cjs` (iFood polling/order management), `src/components/organisms/OrderSidebar.jsx` (UI), `src/components/organisms/CartPanel.jsx` (UI), and `database/validate.cjs` (IPC channels `ifood:*`).
    - #8 — Relatório financeiro em PDF: **CLOSED AND IMPLEMENTED**. Verified by `src/components/organisms/ReportsModal.jsx` (PDF generation), `main.cjs` (dialog:save-pdf IPC handler), and `package.json` (`pdfmake` dependency).
- `npm run typecheck` exists in `package.json` (line 21), confirming its accuracy in the existing `AGENTS.md`.

## Decisions (with rationale)

- **Update `AGENTS.md`**:
    - Fix the stale reference from `.js` to `.ts` for `src/store/useStore`.
    - Add a note about the implemented iFood and PDF export features, linking back to their corresponding IPC channels in `validate.cjs`.
- **Update `README.md`**:
    - Remove the roadmap section referencing issues #7 and #8 as "🔜" since they are already implemented.

## Scope IN

- Edit `AGENTS.md` to fix the stale reference and add notes about implemented features.
- Edit `README.md` to update the roadmap section.

## Scope OUT (Must NOT have)

- NO changes to actual product/source code.
- NO implementation of any new features.
- NO closing/opening of GitHub issues (no `gh CLI` use).

## Todos

- [x] 1. AGENTS.md: Fix stale `src/store/useStore.js` reference to `src/store/useStore.ts` - expect file to be updated.
- [x] 2. AGENTS.md: Add notes about implemented iFood integration and PDF financial reports, referencing relevant IPC channels in `database/validate.cjs` - expect new content in AGENTS.md.
- [x] 3. README.md: Remove the "Roadmap" section (lines 83-88) - expect section to be deleted.

## Final verification wave

- [x] F1. Verify `src/store/useStore.ts` exists and is correctly referenced in `AGENTS.md`.
- [x] F2. Verify `AGENTS.md` includes notes about iFood and PDF features.
- [x] F3. Verify `README.md` no longer contains the "Roadmap" section.

## Results

The plan is approved and verified. All planned edits have been completed:

1. **AGENTS.md Updated**: 
   - Fixed stale `src/store/useStore.js` reference to `src/store/useStore.ts`
   - Added comprehensive notes about implemented iFood integration and PDF financial report features
   - Referenced relevant IPC channels in `database/validate.cjs`
   - Condensed all content to focus on high-signal, hard-earned facts

2. **README.md Updated**:
   - Removed the "Roadmap" section referencing issues #7 and #8 as "🔜"
   - Both features are now documented as closed and implemented

3. **Verification Complete**:
   - All planned todos are marked completed
   - All final verification criteria pass
   - The AGENTS.md file is compact, accurate, and follows the "Would an agent miss this?" filter
