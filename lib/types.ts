export type TripStatus = "parsing" | "reviewing" | "settled" | "coordinating";

export interface Trip {
  id: string;
  name: string;
  currency: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
}

export type SplitMode = "equal" | "custom";

export interface Expense {
  id: string;
  trip_id: string;
  paid_by_id: string;
  description: string;
  amount: number;
  split_mode: SplitMode;
  batch: number;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
}

export interface ExpenseWithDetails extends Expense {
  paid_by: Participant;
  splits: (ExpenseSplit & { participant: Participant })[];
}

export interface Settlement {
  id: string;
  trip_id: string;
  batch: number;
  created_at: string;
}

export type PaymentStatus = "pending" | "confirmed" | "cancelled";

export interface Payment {
  id: string;
  settlement_id: string;
  from_id: string;
  to_id: string;
  amount: number;
  status: PaymentStatus;
  confirmed_at: string | null;
  created_at: string;
}

export interface PaymentWithNames extends Payment {
  from: Participant;
  to: Participant;
}

export interface ExtractedExpense {
  paid_by: string;
  description: string;
  amount: number;
  split_among: string[] | null;
}

export interface ExtractionResult {
  expenses: ExtractedExpense[];
  participants: string[];
  currency: string;
  notes: string | null;
}

export interface RawInput {
  id: string;
  trip_id: string;
  raw_text: string;
  ai_result: ExtractionResult | null;
  batch: number;
  created_at: string;
}
