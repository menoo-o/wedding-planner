app/dashboard/
├── _db/                    # Raw Supabase queries (keep ALL of them)
│   ├── transactions.ts     # All transaction queries
│   ├── cycles.ts
│   ├── debt.ts
│   ├── categories.ts
│   ├── household.ts
│   └── vendors.ts
│
├── _lib/                   # Pure business logic (no DB calls)
│   ├── finance.ts          # Math: balances, runway, ratios
│   └── ledger.ts           # NEW: shared ledger calculations
│
├── _services/              # Orchestration layer (compose DB + lib)
│   └── dashboard.ts        # Assembles DashboardData
│
├── components/             # UI components
│
└── page.tsx                # Thin shell, just renders