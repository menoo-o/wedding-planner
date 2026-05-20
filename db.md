Table: transactions -> col transaction_type

Allowed values should become:

top_up → money added to house
expense → real consumption
settlement → house repaid someone
loan_out → house lent cash outward
loan_return → someone returned borrowed cash
refund → returned expense money
adjustment → manual correction


col : payment_source

'household_fund',
'personal_cover',
'card',
'bank_transfer',
'cash_return'

col : reimbursement_status in 
    'none',
    'pending',
    'settled',
    'cancelled',
    'partial'

<!-- Inserting an entry to transactions table SQL   -->
insert into public.transactions
(
  household_id,
  cycle_id,
  created_by,
  transaction_type,
  category_id,
  counterparty_name,
  amount,
  description,
  reimbursement_status,
  notes,
  payment_account,
  paid_by,
  related_transaction_id
)
values
(
  'b230d55f-2905-45d6-83e0-c84249959e4c',   -- household_id
  '4485cd74-eb0e-435a-8b17-adca40603b40',   -- monthly_cycles.id
  'c12192ec-0eca-46aa-827c-537d345e6232',   -- profiles.id
  'expense',                                -- transaction_type
  null,   --category_id
  'HDM',                                     --counterparty_name
  2380,                                     --amount
  'Atta-10Kg, DairyOmung-3L',                          --description
  'pending',                                     -- reimbursement_status
  'Ordered via Foodpanda',                           --notes
  'cash',                        --payment_account
  'household'                     -- paid_by
  null                                   --related_transaction_id                 
  
);


<!-- SETTLING A LOAN - RECEIVED PAYMENT -->
insert into public.transactions
(
  household_id,
  cycle_id,
  created_by,
  transaction_type,
  category_id,
  counterparty_name,
  amount,
  description,
  reimbursement_status,
  payment_source,
  related_transaction_id,
  cleared_at
)
values
(
  'b230d55f-2905-45d6-83e0-c84249959e4c',  -- household_id
  '39fae3a9-3f4d-4026-b86d-46ca158ab9b0',                  -- current month
  'c12192ec-0eca-46aa-827c-537d345e6232',                       -- who recorded it
  'loan_return',                              --transaciton type
  null,                                      --category_id
  'HDM',                                      --counterparty_name
  1490,                                       --amount
  'HDM Reimburses Coffee Payment',             -- description
  'settled',                                  -- reimbursement_status
  'cash_return',                              -- payment_source
  'aca78478-bb34-4b64-920f-23838e235976',                                -- 🔥 link to original loan_out
  now()
);

<!-- THEN UPDATE ORIGINAL LOAN -->
update public.transactions
set 
  reimbursement_status = 'settled',
  cleared_at = now()
where id = 'tx-id (original)';

<!-- Check contraints on a col -->
SELECT 
    con.conname AS constraint_name, 
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
JOIN pg_catalog.pg_namespace nsp ON nsp.oid = con.connamespace
WHERE rel.relname = 'transactions' 
  AND att.attname = 'payment_source';


<!-- Check category-wise spending in a month -->
WITH category_data AS (
  SELECT 
    c.name AS label, 
    SUM(t.amount) AS amount
  FROM public.transactions t
  JOIN public.categories c ON t.category_id = c.id
  WHERE t.household_id = 'b230d55f-2905-45d6-83e0-c84249959e4c' AND t.cycle_id = '39fae3a9-3f4d-4026-b86d-46ca158ab9b0'
  GROUP BY c.name
)
-- Part 1: The Category List
SELECT label, amount FROM category_data
UNION ALL
-- Part 2: The Single Total Row
SELECT 'GRAND TOTAL', SUM(amount) FROM category_data;

<!-- ///////////////////////////////////////// -->
<!--Transaction Table Rules -->
paid_by & reimbursement_status — FINAL RULE
  ->These belong ONLY to expense
  ->paid_by → who paid for consumption  
  ->reimbursement_status → whether that expense is settled

<!--Case A — House paid: -->
transaction_type = 'expense'
paid_by = 'household'
reimbursement_status = NULL
counterparty_name = NULL
cleared_at = NULL

<!-- Case B — Ali paid (important) -->
transaction_type = 'expense'
paid_by = 'other'
reimbursement_status = 'pending'
counterparty_name = 'Ali'   ← IMPORTANT (we’ll use this)
cleared_at = NULL
<!-- When settled -->
transaction_type = 'settlement'
counterparty_name = 'Ali'
related_transaction_id → expense
<!--Updating-->
reimbursement_status = 'settled'
cleared_at = settlement.created_at







<!-- ///////////////////////////////////////////////////////// -->
<!-- CHECK CASH LIQUIDIDTY -->

WITH current_cycle_tx AS (
  -- Grab all transactions for this household and cycle
  SELECT * FROM public.transactions 
  WHERE household_id = 'b230d55f-2905-45d6-83e0-c84249959e4c' 
    AND cycle_id = '39fae3a9-3f4d-4026-b86d-46ca158ab9b0'
),

category_data AS (
  -- Summarize expenses by category
  SELECT 
    c.name AS label, 
    SUM(t.amount) AS amount
  FROM current_cycle_tx t
  JOIN public.categories c ON t.category_id = c.id
  WHERE t.transaction_type = 'expense'
  GROUP BY c.name
),

liquidity_data AS (
  -- Calculate current physical cash on hand
  SELECT 
    mc.opening_balance + 
    COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('top_up', 'loan_return')), 0) -
    COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('expense', 'settlement', 'loan_out') AND t.payment_account != 'personal'), 0) 
    AS cash_in_hand
  FROM public.monthly_cycles mc
  LEFT JOIN current_cycle_tx t ON t.cycle_id = mc.id
  WHERE mc.id = '39fae3a9-3f4d-4026-b86d-46ca158ab9b0'
  GROUP BY mc.opening_balance
)

-- 1. The Category List
SELECT label, amount, 1 AS sort_order FROM category_data

UNION ALL

-- 2. The Total Expense Row
SELECT '--- TOTAL EXPENSES ---', COALESCE(SUM(amount), 0), 2 FROM category_data

UNION ALL

-- 3. The Liquidity Row
SELECT 'CASH LIQUIDITY (Available)', cash_in_hand, 3 FROM liquidity_data

ORDER BY sort_order, amount DESC;
<!-- ////////////////////////////////////////////////////////////////// -->