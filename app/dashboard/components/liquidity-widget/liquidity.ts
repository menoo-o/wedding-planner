import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

export const getLiveServerLiquidity = cache(async (householdId: string) => {
  const supabase = await createClient();

  // 1. Fetch current active cycle
  const { data: cycle, error: cycleError } = await supabase
    .from('monthly_cycles')
    .select('id, opening_cash_balance, opening_bank_balance')
    .eq('household_id', householdId)
    .eq('is_closed', false)
    .maybeSingle();

  if (cycleError || !cycle) {
    return { cash: 0, card: 0, total: 0, monthlyExpenses: 0, cycleId: null };
  }

  // 2. Fetch all transactions logged within this active cycle (include notes)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, payment_account, transaction_type, description, notes')
    .eq('cycle_id', cycle.id);

  // 3. Set starting baselines
  const openingCash = parseFloat(cycle.opening_cash_balance || '0');
  const openingBank = parseFloat(cycle.opening_bank_balance || '0');

  let cashChange = 0;
  let bankChange = 0;
  let accumulatedExpenses = 0;

  // 4. Run ledger arithmetic
  transactions?.forEach((tx) => {
    const val = parseFloat(tx.amount || '0');

    // Determine direction for repayments / settlements
    const isInflowSettlement =
      ['settlement', 'loan_return'].includes(tx.transaction_type) &&
      tx.notes?.includes('[inflow]');

    const isOutflowSettlement =
      ['settlement', 'loan_return'].includes(tx.transaction_type) &&
      !isInflowSettlement; // default to outflow if not marked [inflow]

    // Base classifications
    const isAddition =
      ['top_up', 'loan_in'].includes(tx.transaction_type) || isInflowSettlement;

    const isDeduction =
      ['expense', 'loan_out'].includes(tx.transaction_type) || isOutflowSettlement;

    const isPaidExpense = tx.transaction_type === 'expense' && tx.payment_account !== null;
    const isPendingVendorExpense = tx.transaction_type === 'expense' && tx.payment_account === null;

    if (isPaidExpense || isPendingVendorExpense) {
      accumulatedExpenses += val;
    }

    // Cash interactions
    if (tx.payment_account === 'cash') {
      if (isAddition) cashChange += val;
      if (isDeduction) cashChange -= val;
      if (tx.transaction_type === 'transfer') {
        if (tx.description?.startsWith('Transfer in')) cashChange += val;
        if (tx.description?.startsWith('Transfer out')) cashChange -= val;
      }
    } 
    // Bank Card interactions
    else if (tx.payment_account === 'card') {
      if (isAddition) bankChange += val;
      if (isDeduction) bankChange -= val;
      if (tx.transaction_type === 'transfer') {
        if (tx.description?.startsWith('Transfer in')) bankChange += val;
        if (tx.description?.startsWith('Transfer out')) bankChange -= val;
      }
    }
  });

  const finalCash = openingCash + cashChange;
  const finalBank = openingBank + bankChange;

  return {
    cash: finalCash,
    card: finalBank,
    total: finalCash + finalBank,
    monthlyExpenses: accumulatedExpenses,
    cycleId: cycle.id
  };
});