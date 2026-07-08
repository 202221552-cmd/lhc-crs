## Goal
- Professional financial management system focused on installment management: category-based installments (subscription + extra fees), scheduling with count/amount/date control, student balance tracking, separate receipt management.

## Constraints & Preferences
- RTL Arabic layout with split-panel design (left 36%: search + student info + action buttons + edit form; right: subscriptions section + رسوم إضافية card + installments table + timeline).
- Installment categories: قسط اشتراك, بدل مخالفة, بدل غرامات, بدل امتيازات, بدل أخرى — selected via colored chips in add form.
- EXTRA installments (non-subscription) stored as `subscriptionType: 'EXTRA'`, `subscriptionId: 'EXTRA-{category}'`.
- رسوم إضافية displayed as a separate card below the subscriptions table (not in same table).
- Schedule button only shows for non-EXTRA subscriptions with >1 unpaid installment.
- No pay/void functionality on installments page — installments are scheduling-only; payments handled via receipts page.
- Schedule modal: total remaining + count stepper with auto-distribute across installments; supports create (POST), update (PUT), delete (excess existing via DELETE).
- DeepSearchModal for student search with `deepSearchTarget` state.
- Same CSS design system: `split-layout`, `glass-panel`, `glass-table`, `glass-btn`, `badge`, etc.

## Progress

### Done
- **Installment categories**: `CATEGORIES` constant with `SUBSCRIPTION, PENALTY, FINE, PRIVILEGE, OTHER` — each with icon, color, and label.
- **Backend POST /installments**: accepts `category` field; for non-SUBSCRIPTION, sets `subscriptionType: 'EXTRA'` and `subscriptionId: 'EXTRA-{category}'`.
- **Backend GET /installments**: now filters by `subscriptionType` query param (was missing before).
- **رسوم إضافية card**: separate clickable card below subscriptions table with count badge; opens EXTRA installments via `GET /installments?studentId=X&subscriptionType=EXTRA`.
- **Schedule modal redesigned**: summary bar with total + count stepper (+/− buttons with auto-distribute), installment rows with amount + date fields, total match indicator, save updates existing/POSTs new/DELETEs excess unpaid.
- **Payment UI removed**: `handleQuickPay`, `handlePay`, `handleVoid`, `showPay` state, paymentMethod/ref/wallet/bank/sender fields all removed from FinInstallmentsPage.
- **Schedule button made hero**: gradient background (with animation), larger font (0.82rem), bold 700, glow shadow, scale hover.
- **Add form redesigned**: category chips bigger (7px padding, 2px border, scale+shadow on selected), subscription chips separate for SUBSCRIPTION type, descriptive hint for EXTRA types.
- **Import cleanup**: removed `HandCoins`, `CheckSquare`, `PAYMENT_METHODS`, `WALLET_OPTIONS`, `BANK_OPTIONS` from FinInstallmentsPage; added `AlertTriangle`, `Award`, `FileWarning`, `Calendar`.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **Payments removed from installments page**: Installments page is now scheduling-only; pay/void moved to receipts page flow. Keeps the page focused.
- **EXTRA type convention**: `subscriptionType: 'EXTRA'` with `subscriptionId: 'EXTRA-{category}'` avoids schema changes while enabling filtering and display.
- **Schedule modal creates/deletes**: When count increases, new installments POSTed; when decreases, excess unpaid installments DELETEd. Clean maintainability.
- **Add form uses `selSub`**: Subscription selection in add form chips sets `selSub` (same state as right panel selection), keeping both panels in sync.
- **Schedule button condition**: Only shown when `unpaidInsts.length > 1 && selSub.id !== 'EXTRA'` — single installment or EXTRA doesn't need scheduling.

## Next Steps
- Test end-to-end: search student → select subscription → schedule installments (change count, amounts, dates) → verify create/update/delete.
- Test EXTRA flow: add قسط for مخالفة → select رسوم إضافية → verify it appears in EXTRA table.
- Test balance: verify pay-student from receipts page includes EXTRA installments in FIFO deduction.
- Verify print receipt from FinReceiptsPage.

## Critical Context
- `apiFetch` returns `{ apiFetch }` — must destructure.
- Backend `installment.ts`: GET accepts `subscriptionType`; POST accepts `category`; DELETE handles EXTRA subscription installments.
- Prisma: no new schema changes for EXTRA — uses existing `subscriptionType` + `subscriptionId` string fields.
- `CATEGORIES` defined as `const` at module level in FinInstallmentsPage.
- `catLabel(inst)` returns `CATEGORIES.find(c => inst.subscriptionId === 'EXTRA-${c.value}')` for display.
- CSS classes: `split-layout`, `split-panel`, `glass-panel`, `glass-input`, `glass-btn`, `badge`, `section-title`, `search-bar`, `empty-state`, `form-group`, `form-label`, `glass-table`, `glass-table-container`, `text-muted`, `stat-card`.

## Relevant Files
- `/Users/mosanazmi/Desktop/work2/frontend/src/pages/FinInstallmentsPage.tsx`: full rewrite — category chips, schedule modal, EXTRA support, hero schedule button, no payment UI.
- `/Users/mosanazmi/Desktop/work2/frontend/src/pages/FinReceiptsPage.tsx`: receipts/refunds with deep search, balance, deduct toggle, wallet/bank/sender.
- `/Users/mosanazmi/Desktop/work2/frontend/src/utils/constants.ts`: `WALLET_OPTIONS`, `BANK_OPTIONS`, `PAYMENT_METHODS`.
- `/Users/mosanazmi/Desktop/work2/backend/src/routes/installment.ts`: GET supports `subscriptionType` filter; POST accepts `category` for EXTRA type.
- `/Users/mosanazmi/Desktop/work2/backend/src/routes/financial.ts`: pay-student, receipt, void, summary, balance endpoints.
- `/Users/mosanazmi/Desktop/work2/backend/prisma/schema.prisma`: `paymentWallet`, `paymentBank`, `senderInfo` on Installment + FinancialTransaction.
