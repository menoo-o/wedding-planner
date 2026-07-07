//app/dashboard/_services/vendors.ts
import { createClient } from '@/utils/supabase/server'; // Adjust based on your server-client helper setup

export interface Vendor {
  id: string;
  household_id: string;
  name: string;
  default_category_id: string | null;
  billing_cycle: 'weekly' | 'monthly' | 'on_demand';
  created_at: string;
}

export interface VendorTransaction {
  id: string;
  household_id: string;
  cycle_id: string;
  created_by: string;
  transaction_type: 'expense' | 'settlement';
  payment_account: 'cash' | 'card' | 'personal' | null;
  amount: number;
  description: string;
  notes: string | null;
  created_at: string;
  paid_by: 'household' | 'someone_else' | 'pending_vendor';
  category_id: string | null;
  vendor_id: string | null;
  parent_settlement_id: string | null;
}

export interface VendorBalanceSheet {
  vendor: Vendor;
  unpaidBalance: number;
  pendingTransactions: VendorTransaction[];
  settledTransactions: VendorTransaction[];
}

/**
 * Fetches all active vendors registered under a specific household.
 */
export async function getVendors(householdId: string): Promise<Vendor[]> {
const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('id, household_id, name, default_category_id, billing_cycle, created_at')
    .eq('household_id', householdId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching vendors:', error.message);
    throw new Error(`Failed to load vendors: ${error.message}`);
  }

  return (data || []) as Vendor[];
}

/**
 * Queries the ledger to split a vendor's delivery history into
 * Unpaid (Accrued) lines and past Settled receipts.
 */
export async function getVendorBalanceSheet(vendorId: string): Promise<VendorBalanceSheet> {
  const supabase = await createClient();

  // 1. Fetch vendor master details
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, household_id, name, default_category_id, billing_cycle, created_at')
    .eq('id', vendorId)
    .single();

  if (vendorError || !vendor) {
    throw new Error(`Vendor not found: ${vendorError?.message || 'No record matches.'}`);
  }

  // 2. Fetch all transactions associated with this vendor
  const { data: txs, error: txsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (txsError) {
    throw new Error(`Failed to load vendor ledger: ${txsError.message}`);
  }

  const typedTxs = (txs || []) as VendorTransaction[];

  // 3. Separate transactions into Pending and Settled piles
  // Pending deliveries have NO parent settlement link and are flagged as pending_vendor
  const pendingTransactions = typedTxs.filter(
    (tx) => tx.parent_settlement_id === null && tx.paid_by === 'pending_vendor'
  );

  // Settled lines represent deliveries already cleared or the settlement payouts themselves
  const settledTransactions = typedTxs.filter(
    (tx) => tx.parent_settlement_id !== null || tx.transaction_type === 'settlement'
  );

  // 4. Calculate outstanding accrued tab balance
  const unpaidBalance = pendingTransactions.reduce((total, tx) => total + Number(tx.amount || 0), 0);

  return {
    vendor: vendor as Vendor,
    unpaidBalance,
    pendingTransactions,
    settledTransactions,
  };
}

/**
 * Settles a vendor account balance by:
 * 1. Recording a single payout 'settlement' transaction (deducting cash/card).
 * 2. Stamping all active unpaid vendor entries with this new transaction's ID as parent_settlement_id.
 * Includes automated manual rollback cleanup in case of secondary update failures!
 */
export async function settleVendorAccount(
  vendorId: string,
  paymentAccount: 'cash' | 'card',
  amount: number,
  userId: string,
  householdId: string,
  cycleId: string,
  vendorName: string
): Promise<string> {
  const supabase = await createClient();
  const timestamp = new Date().toISOString();

  // 1. Create a clear single payout ledger line reflecting physical cash movement
  const settlementPayload = {
    household_id: householdId,
    cycle_id: cycleId,
    created_by: userId,
    transaction_type: 'settlement',
    payment_account: paymentAccount,
    amount: amount,
    description: `Settled account with ${vendorName}`,
    notes: `Bulk settlement receipt clearing active accrued ledger balance.`,
    created_at: timestamp,
    paid_by: 'household', // Mark as paid by household using real funds
    vendor_id: vendorId,
    parent_settlement_id: null,
  };

  const { data: newSettlement, error: insertError } = await supabase
    .from('transactions')
    .insert(settlementPayload)
    .select('id')
    .single();

  if (insertError || !newSettlement) {
    throw new Error(`Settlement failed to record: ${insertError?.message || 'Insert yielded no ID.'}`);
  }

  const settlementTxId = newSettlement.id;

  // 2. Map all outstanding pending logs to point to this settlement receipt
  const { error: updateError } = await supabase
    .from('transactions')
    .update({ parent_settlement_id: settlementTxId })
    .eq('vendor_id', vendorId)
    .eq('paid_by', 'pending_vendor')
    .is('parent_settlement_id', null);

  // 🔒 Fail-Safe Rollback Layer: If link updates fail, erase the settlement payout line to prevent balance leakage
  if (updateError) {
    console.error('Relational update failed. Rollying back settlement transaction...');
    await supabase.from('transactions').delete().eq('id', settlementTxId);
    throw new Error(`Ledger link update failed: ${updateError.message}. Settlement was rolled back safely.`);
  }

  return settlementTxId;
}

export async function createVendor(payload: {
  household_id: string;
  name: string;
  default_category_id?: string | null;
  billing_cycle?: string;
}) {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vendors")
    .insert([
      {
        household_id: payload.household_id,
        name: payload.name,
        default_category_id: payload.default_category_id || null,
        billing_cycle: payload.billing_cycle || "monthly",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}