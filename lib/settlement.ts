import type { ExpenseSplit, Payment } from "./types";

interface BalanceInput {
  participantId: string;
  totalPaid: number;
  totalOwed: number;
}

interface DirectedPayment {
  fromId: string;
  toId: string;
  amount: number;
}

export function computeBalances(
  expenses: { paid_by_id: string; amount: number }[],
  splits: ExpenseSplit[]
): BalanceInput[] {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();

  for (const expense of expenses) {
    paid.set(expense.paid_by_id, (paid.get(expense.paid_by_id) ?? 0) + expense.amount);
  }

  for (const split of splits) {
    owed.set(split.participant_id, (owed.get(split.participant_id) ?? 0) + split.amount);
  }

  const allIds = new Set([...paid.keys(), ...owed.keys()]);
  return Array.from(allIds).map((id) => ({
    participantId: id,
    totalPaid: paid.get(id) ?? 0,
    totalOwed: owed.get(id) ?? 0,
  }));
}

export function computeSettlement(
  balances: BalanceInput[],
  confirmedPayments: Pick<Payment, "from_id" | "to_id" | "amount">[]
): DirectedPayment[] {
  // Net balance per participant: positive = owed money, negative = owes money
  const net = new Map<string, number>();

  for (const b of balances) {
    net.set(b.participantId, (net.get(b.participantId) ?? 0) + b.totalPaid - b.totalOwed);
  }

  // Subtract effect of already-confirmed payments
  for (const p of confirmedPayments) {
    net.set(p.from_id, (net.get(p.from_id) ?? 0) + p.amount);
    net.set(p.to_id, (net.get(p.to_id) ?? 0) - p.amount);
  }

  // Work in cents to avoid floating point issues
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of net) {
    const cents = Math.round(balance * 100);
    if (cents > 0) {
      creditors.push({ id, amount: cents });
    } else if (cents < 0) {
      debtors.push({ id, amount: -cents });
    }
  }

  // Sort descending by amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const payments: DirectedPayment[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);
    if (amount > 0) {
      payments.push({
        fromId: debtors[di].id,
        toId: creditors[ci].id,
        amount: amount / 100,
      });
    }
    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;
    if (creditors[ci].amount === 0) ci++;
    if (debtors[di].amount === 0) di++;
  }

  return payments;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
