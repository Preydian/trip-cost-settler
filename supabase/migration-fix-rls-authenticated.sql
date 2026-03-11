-- Fix RLS policies: grant authenticated users access to all tables.
-- The original schema only granted access TO anon, blocking signed-in users.

-- participants
CREATE POLICY "Allow authenticated access to participants"
  ON public.participants FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- expenses
CREATE POLICY "Allow authenticated access to expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- expense_splits
CREATE POLICY "Allow authenticated access to expense_splits"
  ON public.expense_splits FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- settlements
CREATE POLICY "Allow authenticated access to settlements"
  ON public.settlements FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- payments
CREATE POLICY "Allow authenticated access to payments"
  ON public.payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- raw_inputs
CREATE POLICY "Allow authenticated access to raw_inputs"
  ON public.raw_inputs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
