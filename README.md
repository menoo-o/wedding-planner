dashboard/
├── _db/                   # or supabase/ — your call
│   ├── household.ts
│   ├── cycles.ts
│   ├── transactions.ts
│   ├── categories.ts
│   └── debt.ts
│
├── _services/
│   └── dashboard.ts       # orchestrates the parallel fetches, calls _db/* 
│
├── _lib/
│   └── finance.ts         # pure calc functions (balances, runway, debtLoadRatio)
│
├── types.ts
├── page.tsx
└── layout.tsx