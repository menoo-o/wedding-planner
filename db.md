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
  payment_source,
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
  'household_fund',                        --household_fund
  null                                     --related_transaction_id                 
  
);