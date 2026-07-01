//app/dashboard/petit/page.tsx

'use client'


import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/utils/supabase/client';
import * as z from 'zod';


//useEffect needed or not ?
//setCatgories why it exits?

const coffeeTransactionSchema = z.object({
  item_name: z.string().min(1, "Item name is required").max(100),
  type: z.enum(["spend", "refuel"]),
  category_id: z.string().min(1).nullable().optional(),

  tokens_amount: z.coerce
    .number()
    .positive("Amount must be greater than 0"),
});

// zod v4 + z.coerce.number() gives the field a different "input" type (unknown,
// since it accepts anything before coercion) than its "output" type (number,
// after coercion). zodResolver needs both, or TS complains that the resolver's
// Resolver<...> type doesn't match useForm's expected type.
type CoffeeFormInput = z.input<typeof coffeeTransactionSchema>;
type CoffeeFormValues = z.output<typeof coffeeTransactionSchema>;

interface Category {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  opening_usdt_balance: number;
  closing_usdt_balance: number;
  is_closed: boolean;
  month: number;
  year: number;
}

interface Transaction {
  id: string;
  cycle_id: string;
  category_id: string | null;
  item_name: string;
  type: 'spend' | 'refuel';
  tokens_amount: number;
  created_at: string;
}

export default function PetitPlaisirWorkspace() {
  // 🚀 Initialized the live client connection
  const supabase =  createClient();

// 🔄 Categories state is now populated dynamically from the DB instead of using a dead mockup set
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 🔄 Cycles list now initializes empty and populates dynamically from "petit_plaisir_cycles"
  const [cycles, setCycles] = useState<Cycle[]>([]);

  // 🚫 REMOVED: Mock dummy transaction list with "Affogato Treat" is completely gone! No more default static array.
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'schema' | 'sim'>('workspace');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CoffeeFormInput, undefined, CoffeeFormValues>({
    resolver: zodResolver(coffeeTransactionSchema),
    defaultValues: {
      item_name: '',
      type: 'spend',
      category_id: 'cat-1',
      tokens_amount: undefined,
    },
  });

  const currentType = watch('type');
  // 💡 Dynamically locate the active (is_closed = false) cycle row fetched straight from Supabase
  const activeCycle = cycles.find(c => !c.is_closed) || cycles[cycles.length - 1];

  /* STREAMING_CHUNK: Defining data fetching and balance logic... */
  // 🚀 Fetches live active parameters directly from your database
  const fetchDatabaseState = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // A. Pull actual custom categories
      const { data: catData } = await supabase
        .from('petit_plaisir_categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (catData) setCategories(catData);

      // B. Pull all historical ledger cycles
      const { data: cycleData } = await supabase
        .from('petit_plaisir_cycles')
        .select('id, opening_usdt_balance, closing_usdt_balance, is_closed, month, year')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (cycleData) {
        // Map database numeric strings back to clean javascript floats
        const parsedCycles: Cycle[] = cycleData.map(c => ({
          id: c.id,
          opening_usdt_balance: parseFloat(c.opening_usdt_balance || '0'),
          closing_usdt_balance: parseFloat(c.closing_usdt_balance || '0'),
          is_closed: c.is_closed,
          month: c.month,
          year: c.year
        }));
        setCycles(parsedCycles);

        // C. Fetch transactions logged for the active cycle to calculate accurate balance limits
        const activeCycleRow = parsedCycles.find(c => !c.is_closed);
        if (activeCycleRow) {
          const { data: txData } = await supabase
            .from('petit_plaisir_transactions')
            .select('id, cycle_id, category_id, item_name, type, tokens_amount, created_at')
            .eq('cycle_id', activeCycleRow.id)
            .order('created_at', { ascending: false });

          if (txData) {
            setTransactions(txData.map(t => ({
              id: t.id,
              cycle_id: t.cycle_id,
              category_id: t.category_id,
              item_name: t.item_name,
              type: t.type as 'spend' | 'refuel',
              tokens_amount: parseFloat(t.tokens_amount || '0'),
              created_at: t.created_at
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching database state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDatabaseState();
  }, [fetchDatabaseState]);

  // 💡 DYNAMIC BALANCE MATHEMATICS: Calculates directly from active cycle opening_usdt_balance + Inflows - Outflows
  const calculateCurrentBalance = () => {
    if (!activeCycle) return 0;
    const cycleTxs = transactions.filter(t => t.cycle_id === activeCycle.id);
    const flowSum = cycleTxs.reduce((acc, tx) => {
      return tx.type === 'refuel' ? acc + tx.tokens_amount : acc - tx.tokens_amount;
    }, activeCycle.opening_usdt_balance);
    return parseFloat(flowSum.toFixed(4));
  };

  const balance = calculateCurrentBalance();

  /* STREAMING_CHUNK: Processing new manual transactions... */
  // 🚀 Logs transaction dynamically directly to your physical database table
  const handleLogTransaction = async (values: CoffeeFormValues) => {
    if (!activeCycle) {
      setNotification({ message: 'No active cycle loaded in memory!', type: 'error' });
      return;
    }

    if (values.type === 'spend' && balance < (values.tokens_amount || 0)) {
      setNotification({ message: 'Insufficient USDT tokens remaining in current cycle!', type: 'error' });
      return;
    }

    // Insert payload mapped to your live Supabase table structure
    const { error } = await supabase
      .from('petit_plaisir_transactions')
      .insert({
        cycle_id: activeCycle.id,
        category_id: values.type === 'spend' ? values.category_id : null,
        item_name: values.item_name,
        type: values.type,
        tokens_amount: values.tokens_amount
      });

    if (error) {
      setNotification({ message: `Database error: ${error.message}`, type: 'error' });
      return;
    }

    // Refresh database cache
    await fetchDatabaseState();
    reset({ type: values.type, item_name: '', category_id: categories[0]?.id || '', tokens_amount: undefined });
    setNotification({ message: 'Transaction logged directly to your Supabase cloud ledger!', type: 'success' });
  };

  /* STREAMING_CHUNK: Executing the simulated pg_cron rollover... */
  // 🚀 Simulated pg_cron execution performs a real database rollover write!
  const triggerSimulatedRollover = async () => {
    if (!activeCycle) return;
    
    // A. Close current cycle in your Supabase DB and log its final closing value
    const { error: updateError } = await supabase
      .from('petit_plaisir_cycles')
      .update({
        is_closed: true,
        closing_usdt_balance: balance
      })
      .eq('id', activeCycle.id);

    if (updateError) {
      setNotification({ message: `Rollover update failed: ${updateError.message}`, type: 'error' });
      return;
    }

    // B. Calculate next month calendar timeline parameters
    let nextMonth = activeCycle.month + 1;
    let nextYear = activeCycle.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    // C. Initialize a new monthly database row with the correct opening balance carried over
    const { error: insertError } = await supabase
      .from('petit_plaisir_cycles')
      .insert({
        opening_usdt_balance: balance,
        is_closed: false,
        month: nextMonth,
        year: nextYear
      });

    if (insertError) {
      setNotification({ message: `Failed to open next month: ${insertError.message}`, type: 'error' });
      return;
    }

    // Fetch fresh database values and verify the rollover
    await fetchDatabaseState();
    setNotification({ message: `Automated pg_cron execution committed! Cycle rolled over to ${nextMonth}/${nextYear} starting with exactly ${balance.toFixed(4)} USDT.`, type: 'success' });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-screen bg-zinc-950 text-amber-500">
        <div className="animate-pulse font-mono text-sm">Syncing with live Supabase ledger...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-zinc-100 min-h-screen bg-zinc-950 font-sans">
      
      {/* Dynamic Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <h1 className="text-2xl font-bold tracking-tight text-amber-500">Petit Plaisir Micro-Ledger</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            High-precision USDT treat sandbox isolated entirely from household PKR balance sheets.
          </p>
        </div>

        {/* Live Ledger Pool Stats */}
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 min-w-[150px] shadow-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Cycle</span>
            <span className="text-lg font-bold text-zinc-200 block mt-0.5">
              {activeCycle ? `${new Date(activeCycle.year, activeCycle.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'None'}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 min-w-[180px] shadow-sm text-right">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Wallet Balance</span>
            {/* 💡 The balance display now automatically matches your active opening balance (e.g. 4.6900 USDT as shown in balance.png) */}
            <span className="text-2xl font-black text-emerald-400 block mt-0.5 font-mono">
              {balance.toFixed(4)} <span className="text-xs font-semibold text-zinc-500">USDT</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'workspace' ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          💼 Workspace & Logs
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'schema' ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          📐 Schema & Architecture
        </button>
        <button
          onClick={() => setActiveTab('sim')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'sim' ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          ⏳ Rollover Simulator
        </button>
      </div>

      {/* Feedback Alerts */}
      {notification && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-red-950/20 border-red-900 text-red-400'}`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* React Hook Form Module */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit(handleLogTransaction)} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Log Transaction</h3>

              {/* Inflow vs Outflow toggle */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                <button
                  type="button"
                  onClick={() => { setValue('type', 'spend'); if (categories.length > 0) setValue('category_id', categories[0].id); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${currentType === 'spend' ? 'bg-zinc-800 text-amber-500 font-bold shadow' : 'text-zinc-500'}`}
                >
                  ☕ Spend
                </button>
                <button
                  type="button"
                  onClick={() => { setValue('type', 'refuel'); setValue('category_id', null); }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${currentType === 'refuel' ? 'bg-zinc-800 text-emerald-500 font-bold shadow' : 'text-zinc-500'}`}
                >
                  🔋 Refuel
                </button>
              </div>

              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Item Name</label>
                <input
                  {...register('item_name')}
                  type="text"
                  placeholder={currentType === 'spend' ? "e.g., Croissant & Cappuccino" : "e.g., Credit Injection"}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-amber-500/50 transition-all"
                />
                {errors.item_name && <p className="text-[10px] text-red-400">{errors.item_name.message}</p>}
              </div>

              {/* Conditional Category Selector */}
              {currentType === 'spend' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
                  <select
                    {...register('category_id')}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-amber-500/50 transition-all"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-[10px] text-red-400">{errors.category_id.message}</p>}
                </div>
              )}

              {/* Token Amount Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Tokens (USDT Volume)</label>
                <input
                  {...register('tokens_amount')}
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-amber-500/50 font-mono transition-all"
                />
                {errors.tokens_amount && <p className="text-[10px] text-red-400">{errors.tokens_amount.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider ${currentType === 'spend' ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950' : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950'}`}
              >
                {isSubmitting ? 'Logging...' : currentType === 'spend' ? 'Deduct Treat Limit' : 'Add Refuel Tokens'}
              </button>
            </form>
          </div>

          {/* Micro-Ledger Logs */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase px-1">Ledger History (Current Cycle)</h3>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
              {transactions.filter(t => t.cycle_id === activeCycle.id).length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  No transaction entries logged in this cycle yet.
                </div>
              ) : (
                transactions.filter(t => t.cycle_id === activeCycle.id).map((tx) => {
                  const category = categories.find(c => c.id === tx.category_id);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700/50 transition-all shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-200">{tx.item_name}</p>
                          {tx.type === 'spend' && (
                            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-medium border border-zinc-750">
                              {category?.name || 'Uncategorized'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                          {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`font-mono text-sm font-bold ${tx.type === 'refuel' ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {tx.type === 'refuel' ? '+' : '-'}{tx.tokens_amount.toFixed(4)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* Database Schema Visualizer */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase">Database ER Relationship Model</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This layout charts the logical isolation of your token assets. Spends are directly bound to cycles, meaning balances are calculated historically on-the-fly rather than compiled as a single column snapshot.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Cycles Schema Table */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                <div className="bg-amber-600 text-zinc-950 font-bold px-4 py-2 text-xs uppercase tracking-wider">
                  petit_plaisir_cycles
                </div>
                <div className="p-4 space-y-2 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-emerald-400 font-bold">id (PK)</span>
                    <span className="text-zinc-500">UUID</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span>opening_usdt_balance</span>
                    <span className="text-zinc-500">NUMERIC(12,4)</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span>closing_usdt_balance</span>
                    <span className="text-zinc-500">NUMERIC(12,4)</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span>is_closed</span>
                    <span className="text-zinc-500">BOOLEAN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>month / year</span>
                    <span className="text-zinc-500">INTEGER</span>
                  </div>
                </div>
              </div>

              {/* Transactions Schema Table */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                <div className="bg-zinc-800 text-zinc-100 font-bold px-4 py-2 text-xs uppercase tracking-wider border-b border-zinc-850">
                  petit_plaisir_transactions
                </div>
                <div className="p-4 space-y-2 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-emerald-400 font-bold">id (PK)</span>
                    <span className="text-zinc-500">UUID</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-amber-500 font-bold">cycle_id (FK)</span>
                    <span className="text-zinc-500">UUID</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-amber-500 font-bold">category_id (FK)</span>
                    <span className="text-zinc-500">UUID</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span>item_name</span>
                    <span className="text-zinc-500">VARCHAR(100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>tokens_amount</span>
                    <span className="text-emerald-400">NUMERIC(12,4)</span>
                  </div>
                </div>
              </div>

              {/* Categories Schema Table */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                <div className="bg-zinc-800 text-zinc-100 font-bold px-4 py-2 text-xs uppercase tracking-wider border-b border-zinc-850">
                  petit_plaisir_categories
                </div>
                <div className="p-4 space-y-2 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-emerald-400 font-bold">id (PK)</span>
                    <span className="text-zinc-500">UUID</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span>name</span>
                    <span className="text-zinc-500">VARCHAR(100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>created_at</span>
                    <span className="text-zinc-500">TIMESTAMPTZ</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Automated Rollover simulator */}
      {activeTab === 'sim' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Timeline Visual Explainer */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase">pg_cron Schedule Execution</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every month on the 1st at **12:01 AM**, Supabase&apos;s `pg_cron` wake-up signal executes the custom procedure. 
              It closes the past active cycle, performs the decimal summation checks, and automatically injects a new month&apos;s baseline.
            </p>

            {/* Custom visual timeline indicator */}
            <div className="relative border-l border-zinc-800 pl-6 ml-2 space-y-6 pt-4">
              <div className="relative">
                <span className="absolute -left-[30px] top-0 bg-amber-600 text-zinc-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">1</span>
                <h4 className="text-xs font-semibold text-zinc-200">Minute 01 (12:01 AM)</h4>
                <p className="text-[11px] text-zinc-500 mt-1">Wake up trigger executes transaction block safely.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[30px] top-0 bg-amber-600 text-zinc-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">2</span>
                <h4 className="text-xs font-semibold text-zinc-200">Close Active Cycle</h4>
                <p className="text-[11px] text-zinc-500 mt-1">Summates starting USDT + Refuels - Spends, then flags as closed.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[30px] top-0 bg-emerald-600 text-zinc-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">3</span>
                <h4 className="text-xs font-semibold text-zinc-200">Initialize New Month</h4>
                <p className="text-[11px] text-zinc-500 mt-1">Creates next cycle row setting its starting balance directly to past closing value.</p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Dashboard */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider uppercase">Interactive Sandbox Roller</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Simulate the automated monthly `pg_cron` execution manually! Observe how your remaining USDT balance propagates cleanly into next month&apos;s database container without causing rounding drift.
            </p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold">Active Month Balance:</span>
                <span className="font-mono font-bold text-emerald-400">{balance.toFixed(4)} USDT</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold">Target Starting Month:</span>
                <span className="font-bold text-zinc-200">
                  {activeCycle ? (activeCycle.month === 12 ? `January ${activeCycle.year + 1}` : `${new Date(activeCycle.year, activeCycle.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`) : 'Loading...'}
                </span>
              </div>

              <button
                type="button"
                onClick={triggerSimulatedRollover}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all mt-2"
              >
                ⚡ Trigger Manual Rollover
              </button>
            </div>

            {/* Cycle History Logs Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Simulated Cycles Timeline</h4>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {cycles.map((cy) => (
                  <div key={cy.id} className="flex justify-between items-center p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-mono">
                    <span className="font-bold text-zinc-400">
                      {new Date(cy.year, cy.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-zinc-500">
                        {cy.is_closed ? `Closed: ${cy.closing_usdt_balance.toFixed(4)} USDT` : `Open: ${cy.opening_usdt_balance.toFixed(4)} USDT`}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${cy.is_closed ? 'bg-zinc-700' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}