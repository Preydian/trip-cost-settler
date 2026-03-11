import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/settlement";
import type { ExpenseWithDetails, Participant } from "@/lib/types";

export function ParseSummary({
  expenses,
  participants,
  currency,
}: {
  expenses: ExpenseWithDetails[];
  participants: Participant[];
  currency: string;
}) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses Extracted</CardTitle>
        <CardDescription>
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""} totalling{" "}
          {formatCurrency(total, currency)} were parsed from the pasted messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            Participants
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {participants.map((p) => (
              <Badge key={p.id} variant="secondary">
                {p.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
