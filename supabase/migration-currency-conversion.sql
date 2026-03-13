-- Add settlement currency to trips
ALTER TABLE public.trips
  ADD COLUMN settlement_currency text DEFAULT NULL;

-- Add currency conversion rates to settlements (stores exchange rates used)
ALTER TABLE public.settlements
  ADD COLUMN currency_conversion jsonb DEFAULT NULL;
