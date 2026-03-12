-- Add source_text column to expenses table
-- Stores the original text snippet the AI extracted each expense from
ALTER TABLE public.expenses ADD COLUMN source_text text;
