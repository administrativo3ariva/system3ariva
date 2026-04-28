-- Add company allocations to recurring expense templates (similar to category allocations)
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS company_allocations jsonb;

-- Track payment status per generated run (paid/pending) directly, since runs no longer create payment_requests
ALTER TABLE public.recurring_expense_runs
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_date date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;

-- Drop NOT NULL on payment_request_id since runs are now self-contained
ALTER TABLE public.recurring_expense_runs
  ALTER COLUMN payment_request_id DROP NOT NULL;