-- Trip Cost Settler schema
-- Run this in the Supabase SQL Editor to set up the database.

-- 1. Trips
CREATE TABLE public.trips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  currency    text NOT NULL DEFAULT 'USD',
  status      text NOT NULL DEFAULT 'parsing'
                CHECK (status IN ('parsing','reviewing','settled','coordinating')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to trips" ON public.trips FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Participants
CREATE TABLE public.participants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(trip_id, name)
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to participants" ON public.participants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX idx_participants_trip ON public.participants(trip_id);

-- 3. Expenses
CREATE TABLE public.expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_id  uuid NOT NULL REFERENCES public.participants(id),
  description text NOT NULL,
  amount      numeric(10,2) NOT NULL CHECK (amount > 0),
  split_mode  text NOT NULL DEFAULT 'equal'
                CHECK (split_mode IN ('equal','custom')),
  batch       int NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX idx_expenses_trip ON public.expenses(trip_id);

-- 4. Expense splits (who owes what share of each expense)
CREATE TABLE public.expense_splits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id      uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id  uuid NOT NULL REFERENCES public.participants(id),
  amount          numeric(10,2) NOT NULL,
  UNIQUE(expense_id, participant_id)
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to expense_splits" ON public.expense_splits FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX idx_splits_expense ON public.expense_splits(expense_id);

-- 5. Settlements (a snapshot of computed payments)
CREATE TABLE public.settlements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  batch       int NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(trip_id, batch)
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to settlements" ON public.settlements FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. Payments (directed payment instructions within a settlement)
CREATE TABLE public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id   uuid NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  from_id         uuid NOT NULL REFERENCES public.participants(id),
  to_id           uuid NOT NULL REFERENCES public.participants(id),
  amount          numeric(10,2) NOT NULL CHECK (amount > 0),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled')),
  confirmed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX idx_payments_settlement ON public.payments(settlement_id);

-- 7. Raw inputs (audit trail of pasted text + AI results)
CREATE TABLE public.raw_inputs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  raw_text    text NOT NULL,
  ai_result   jsonb,
  batch       int NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.raw_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to raw_inputs" ON public.raw_inputs FOR ALL TO anon USING (true) WITH CHECK (true);
