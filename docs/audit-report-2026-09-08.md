# Açaí Wave — Module Completeness & Connection Audit Report

**Project**: `/home/caue/Documentos/projetos/vscode-projects/acai-turbo`
**Date**: 2026-09-08
**Branch**: main (2 commits ahead of origin/main; working tree dirty)

---

## Executive Summary

| Metric | Value |
|---|---|
| Total IPC channels (preload allowlist) | 72 |
| Main-process handlers | 67 |
| IPC validators (validate.cjs) | 48 |
| Ghost/dead components | 11 |
| Ghost/dead IPC channels | 3 |
| Overall completeness estimate | **~82%** |

**Biggest risk areas**:
1. Three IPC channels in preload without main handlers
2. `ifood:start-polling` security architecture inconsistency
3. ~30% of component exports are dead code from the app decomposition refactor
4. BUY_X_GET_Y promotion type not handled in renderer discount calculation

---

## 1. Per-Module Status Table

### 1.1 Core Runtime & IPC Infrastructure

| Module | Layer | Status | Evidence | Notes |
|---|---|---|---|---|
| `main.cjs` | main | ✅ Complete | 1312 lines, all IPC groups wired | Rate limiting, session mgmt, printer, ifood polling all functional |
| `preload.js` | main | ✅ Complete | 233 lines, 72 channels explicitly allowlisted | Good security posture |
| `database/validate.cjs` | db | ✅ Complete | 405 lines, 48 validators | Read-only getters intentionally unvalidated (by design) |
| `database/db.cjs` | db | ✅ Complete | 917 lines, all major tables queried | Schema, migrations, seed data all functional |
| `database/migrate.cjs` | db | ✅ Complete | 271 lines, lock-file + checksum | Proper migration engine |
| `database/crypto.cjs` | db | ✅ Complete | 94 lines, AES-256-GCM via safeStorage | Handles iFood tokens |
| `database/logger.cjs` | db | ✅ Complete | 63 lines, Winston structured JSON | Console + file output |
| `src/store/useStore.ts` | renderer | ✅ Complete | 104 lines, cart/table Zustand store | Used by feature screens |
| `src/store/authStore.ts` | renderer | ✅ Complete | 36 lines, login/logout/session | Used by feature screens & AppLayout |
| `src/store/toastStore.js` | renderer | ✅ Complete | 22 lines | Simple message queue |
| `src/store/loadingStore.js` | renderer | ✅ Complete | 10 lines | Simple boolean toggle |
| `src/services/ipc.js` | renderer | ✅ Complete | 19 lines | Thin wrapper around window.electron.ipcRenderer |
| `src/services/logger.js` | renderer | ✅ Complete | 43 lines | WithScope factory, console fallback |
| `src/router/index.jsx` | renderer | ✅ Complete | createHashRouter (fix for Electron file://) | Correct per recent commit |
| `src/router/routes.jsx` | renderer | ✅ Complete | 9 routes defined | All linked to feature screens |
| `src/router/authGuard.js` | renderer | ✅ Complete | 7 lines, localStorage token check | Simple redirect to /login |
| `src/main.jsx` | renderer | ✅ Complete | Entry point; renders RouterProvider | Routes to AppLayout |

### 1.2 Feature Screens

| Module | Layer | Status | Evidence | Notes |
|---|---|---|---|---|
| `LoginScreen.jsx` | renderer | ✅ Complete | 63 lines, invokes auth:login | Role-based redirect after login |
| `ChangePasswordScreen.jsx` | renderer | ✅ Complete | 58 lines | Auth:change-user-password wired |
| `PdvScreen.jsx` | renderer | ✅ Complete | 100 lines, catalog load + search | Live route /pdv |
| `CheckoutScreen.jsx` | renderer | ✅ Complete | 93 lines | orders:save + navigate |
| `NewTableScreen.jsx` | renderer | ✅ Complete | 51 lines | addTable via store |
| `AcaiBuilderScreen.jsx` | renderer | ✅ Complete | 68 lines | Passes through to AcaiBuilderModal |
| `QuickBuilderScreen.jsx` | renderer | ✅ Complete | 50 lines | Passes through to QuickBuilderModal |
| `ReportsScreen.jsx` | renderer | ✅ Complete | 108 lines | Daily + by-period reports + financial summary |
| `SettingsScreen.jsx` | renderer | ✅ Complete | 357 lines | Full settings UI with all tabs |
| `App.jsx` (legacy) | renderer | ❌ DEAD CODE | 966 lines, not imported | Pre-decomposition monolithic entry |
| `AppLayout.jsx` | renderer | ✅ Complete | 224 lines, live main layout | Uses Outlet + OrderSidebar + CartPanel |

### 1.3 IPC Channel Coverage

| Group | Preload | Handlers | Validators | Status |
|---|---|---|---|---|
| catalog:* | 8 | 8 | 4 | ✅ |
| orders:* | 3 | 3 | 3 | ✅ |
| cash:* | 6 | 6 | 4 | ✅ |
| reports:* | 2 | 2 | 1 | ✅ |
| promotions:* | 5 | 5 | 3 | ✅ |
| auth:* | 8 | 8 | 2 | ✅ |
| users:* | 5 | 5 | 3 | ✅ |
| audit:* | 1 | 1 | 1 | ✅ |
| inventory:* | 6 | 6 | 4 | ✅ |
| financial:* | 7 | 7 | 5 | ✅ |
| clients:* | 7 | 6 | 4 | ⚠️ get-by-phone missing handler |
| config:* | 2 | 2 | 1 | ✅ |
| dialog:* | 1 | 1 | 1 | ✅ |
| ifood:* | 8 | 7 | 5 | ⚠️ see ghost section |
| logging:* | 1 | 1 | 1 | ✅ |
| app:* | 2 | 0 | 0 | ❌ no handlers |

---

## 2. End-to-End Connection Chains

### 2.1 Authentication ✅
- Login → auth:login → getUserByUsername + bcrypt → createSession → setSession → store.login → navigate
- Logout → auth:logout → deleteSession → clearSession → storeLogout → navigate /login
- Password change → auth:change-user-password → bcrypt verify → update hash → audit log
- Manager password reset (admin) → auth:reset-manager-password → generate temp → update config
- Force reset admin (admin) → auth:force-reset-admin → update password_hash → audit log
- Rate limiters on verify-password (global) and reset-password (per-user) both work

### 2.2 Catalog / Products ✅
- Load: catalog:get-products + catalog:get-categories → setCatalog/setCategories
- Add: catalog:add-product → validation → insert + price_history
- Update: catalog:update-product → validation → update + price_history transaction
- Delete: catalog:delete-product → delete
- Price history API exists but **not exposed in UI**

### 2.3 Order / Checkout ✅
- Add to cart: store.addItemToActiveTable (local Zustand)
- Remove: store.removeItemFromActiveTable
- Delete table: store.deleteTable
- Checkout: orders:save → DB transaction (orders + order_payments + order_items) → printTickets → toast
- Mixed payments validated (PERMUTA exclusive, sum ≥ total)
- Print: kitchen (TCP/IP) + front (TCP/IP or named printer), cash drawer for non-PERMUTA

### 2.4 Cash Management ✅
- Open: cash:open → openCashSession
- Register movement: cash:register → registerCashMovement
- Preview close: cash:preview-close → compute expected vs closing
- Close: cash:close → closeCashSession with diff
- History: cash:get-history

### 2.5 Reports ✅
- Daily: reports:daily → getDailyReport (sales, exchanges, movements, top products)
- By-period: reports:by-period → getReportByPeriod (+ peak hours, ticket average)
- PDF export: dialog:save-pdf → showSaveDialog → fs.writeFileSync
- Financial summary: financial:get-summary

### 2.6 Promotions ✅
- CRUD: promotions:get/add/update/delete + get-active
- **Gap**: BUY_X_GET_Y type accepted by backend but discount calculation returns 0 in renderer (calculateDiscount only handles PERCENTAGE/FIXED_AMOUNT)

### 2.7 Users ✅
- List: users:get
- Add/Update/Delete: users:add/update/delete (admin minRole)
- Toggle active: users:toggle-active (prevents last-admin deactivation)
- Password change: auth:change-user-password

### 2.8 Inventory ✅
- CRUD: inventory:get/add/update-quantity/adjust
- Movements: inventory:get-movements
- Low stock: inventory:get-low-stock — **API exposed but no UI trigger**

### 2.9 Financial ✅
- Accounts CRUD: financial:get-accounts/add/update-account/delete-account
- Transactions: financial:add-transaction/get-transactions
- Summary: financial:get-summary

### 2.10 Clients ✅
- CRUD: clients:get/add/update/delete
- Orders: clients:get-orders/add-order
- **Gap**: clients:get-by-phone has no main handler (getClientByPhone exists in db.cjs:852)

### 2.11 iFood ⚠️
- Config: config:get-all/update for client_id, client_secret, merchant_id
- Start polling: **ifood:start-polling — missing from ALLOWED_CHANNELS but works via legacy ipcRenderer.invoke() bypass**
- Test connection: ifood:test-connection → OAuth + merchant fetch
- Poll/actions: ifood:poll/startPreparation/readyToPickup/dispatch — all wired
- Push events: webContents.send('ifood:new-order'/'order-cancelled') → renderer listeners
- Pending orders DB: ifood_pending_orders table, full CRUD

### 2.12 Printer / Config ✅
- Printer config: config:get-all/update for printer_kitchen_ip, printer_front_name
- Receipt printing: printTickets in main.cjs, TCP/Epson thermal printer

---

## 3. Ghost / Orphan Inventory

### 3.1 Dead Components (Never Imported)

| Component | Lines | Reason |
|---|---|---|
| `Sidebar` | 67 | Pre-decomposition artifact; replaced by OrderSidebar |
| `CatalogPanel` | 81 | Pre-decomposition artifact; catalog inline in PdvScreen |
| `MainLayout` | 3 | Unused layout wrapper |
| `ModalLayout` | 9 | Unused layout wrapper |
| `AdjustStockModal` | 73 | Never imported; adjust done inline via DOM injection |
| `ConfirmDialog` | ~40 | Never imported; UI uses window.confirm |
| `ThemeToggle` | — | Theme not implemented; dark mode hardcoded |
| `ScrollArea` | — | Not used; custom CSS scrollbar |
| `Divider` | — | Never imported |
| `ModalHeader` | — | Never imported |
| `ModalFooter` | — | Never imported |

### 3.2 Dead IPC Channels

| Channel | Location | Issue |
|---|---|---|
| `app:check-unsaved-orders` | preload.js:88 | No main handler registered |
| `app:shutdown` | preload.js:89 | Renderer listens but main never sends |
| `clients:get-by-phone` | preload.js:68,178 | No main handler (DB fn exists but unused) |

### 3.3 Unused APIs (Exposed but No UI Trigger)

| API | db.cjs location | Gap |
|---|---|---|
| `inventory:get-low-stock` | :699-707 | No UI button; toast only on load |
| `catalog:get-price-history` | :893-896 | No UI surface |
| `getClientByPhone` | :852-857 | No IPC handler |

---

## 4. Broken Logic / Contradiction Inventory

### 4.1 iFood Channel Security Inconsistency (MEDIUM)

`ifood:start-polling` has a validator in `validate.cjs` (line 375-382) but is **NOT** in `ALLOWED_CHANNELS` in `preload.js`.

- Renderer code uses `ipc.invoke()` from `getIPC()` which wraps `raw.invoke(channel, ...args)` — this **bypasses** the `safeInvoke` allowlist check
- Result: the channel works at runtime but violates the documented security architecture (AGENTS.md requires ALL channels in BOTH files)
- **Fix**: Add `'ifood:start-polling': true` to ALLOWED_CHANNELS in preload.js

### 4.2 Permission Model Contradiction (LOW)

Two auth models coexist:
- `runWithManagerAuth` → requires manager-password re-entry (5-min window via authTime)
- `hasPermission` → checks user role only

Settings navigation uses `runWithManagerAuth` (sidebar button), but `SettingsScreen` also uses `runWithAuth` (role-based). An operator with manager password could access settings despite `hasPermission('access_settings')` returning false. This is a design ambiguity, not a hard bug.

### 4.3 BUY_X_GET_Y Promotion Not Applied (LOW)

- Validation accepts BUY_X_GET_Y type
- Database stores it
- `calculateDiscount()` in renderer (App.jsx:270-278, CheckoutScreen.jsx:34-42) only handles PERCENTAGE and FIXED_AMOUNT
- BUY_X_GET_Y falls through to `return 0` — discount never applied
- **Fix**: Add BUY_X_GET_Y logic to calculateDiscount or show "Not supported" warning

### 4.4 Legacy App.jsx Dead Code (INFO)

`src/App.jsx` (966 lines) is the pre-decomposition monolithic entry. It is **not imported** by `src/main.jsx` or any route. All live code uses `src/layouts/AppLayout.jsx` + feature screens.

**Recommendation**: Delete or move to `docs/legacy/` to prevent confusion.

---

## 5. Summary Verdict

### Overall Completeness: **~82%**

| Category | Status |
|---|---|
| Core PDV order flow | ✅ Fully wired |
| Authentication & session | ✅ Working |
| Catalog & products | ✅ Complete |
| Orders & checkout | ✅ Complete |
| Cash management | ✅ Complete |
| Reports (daily + period) | ✅ Complete |
| Promotions | ⚠️ BUY_X_GET_Y not applied in UI |
| Users management | ✅ Complete |
| Inventory | ⚠️ Low-stock API unused in UI |
| Financial | ✅ Complete |
| Clients | ⚠️ getByPhone missing IPC handler |
| iFood integration | ⚠️ Channel consistency issue |
| Printer config | ✅ Complete |
| Ghost code ratio | ~30% of components unused |

### Top Risk Areas (Priority Order)

1. **🟠 MEDIUM — Ghost IPC channels without handlers**: Remove `app:check-unsaved-orders`, `app:shutdown`, `clients:get-by-phone` from preload.js if not needed, or implement handlers.

2. **🟠 MEDIUM — iFood channel security inconsistency**: Add `ifood:start-polling` to `ALLOWED_CHANNELS` in preload.js to match the documented security policy.

3. **🟡 LOW — Legacy App.jsx dead code**: Delete or archive `src/App.jsx` (966 lines) to reduce confusion.

4. **🟡 LOW — BUY_X_GET_Y promotion gap**: Either implement the discount logic in renderer or mark as unsupported in UI.

5. **🟡 LOW — Ghost components cleanup**: Remove or document 11 dead components to reduce bundle size and developer confusion.

6. **🟢 INFO — Unused APIs**: Consider adding UI surfaces for `inventory:get-low-stock` and `catalog:get-price-history` or removing from preload.

---

## Files Created

- `/home/caue/Documentos/projetos/vscode-projects/acai-turbo/docs/audit-report-2026-09-08.md` — Full detailed report
- `/home/caue/Documentos/projetos/vscode-projects/acai-turbo/docs/audit-report-2026-09-08.json` — Structured machine-readable summary

## Source Files Read

All evidence from direct file reads (see JSON for complete list). Key files: main.cjs, preload.js, database/validate.cjs, database/db.cjs, src/layouts/AppLayout.jsx, src/features/settings/SettingsScreen.jsx, src/components/organisms/SettingsModal.jsx, and all feature screens.
