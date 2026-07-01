import { createClient } from '@/utils/supabase/server'; // Adjust based on your server-client helper setup

export async function getLiveServerLiquidity(householdId: string) {
  const supabase = await createClient();

  // 1. Fetch current active cycle with our new split-balance database columns
  const { data: cycle, error: cycleError } = await supabase
    .from('monthly_cycles')
    .select('id, opening_cash_balance, opening_bank_balance')
    .eq('household_id', householdId)
    .eq('is_closed', false)
    .maybeSingle();

  if (cycleError || !cycle) {
    return { cash: 0, card: 0, total: 0, cycleId: null };
  }

  // 2. Fetch all transactions logged within this active cycle
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, payment_account, transaction_type, description')
    .eq('cycle_id', cycle.id);

  // 3. Set the starting baselines from the new split columns
  const openingCash = parseFloat(cycle.opening_cash_balance || '0');
  const openingBank = parseFloat(cycle.opening_bank_balance || '0');

  let cashChange = 0;
  let bankChange = 0;

  // 4. Run ledger arithmetic
  transactions?.forEach((tx) => {
    const val = parseFloat(tx.amount || '0');
    
    // Core addition vs deduction classifications
    const isAddition = ['top_up', 'loan_return', 'loan_in'].includes(tx.transaction_type);
    const isDeduction = ['expense', 'settlement', 'loan_out'].includes(tx.transaction_type);

    // Parse Cash interactions
    if (tx.payment_account === 'cash') {
      if (isAddition) cashChange += val;
      if (isDeduction) cashChange -= val;
      if (tx.transaction_type === 'transfer') {
        // Decode Transfer direction flows cleanly
        if (tx.description?.startsWith('Transfer in')) cashChange += val;
        if (tx.description?.startsWith('Transfer out')) cashChange -= val;
      }
    } 
    // Parse Bank Card interactions (safely tracking both legacy 'card' and clean 'card_meezan' tags)
    else if (tx.payment_account === 'card_meezan' || tx.payment_account === 'card') {
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
    cycleId: cycle.id
  };
}
