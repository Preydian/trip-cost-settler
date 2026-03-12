import { createClient } from "@/lib/supabase/server";
import { getUserTripsWithSummary } from "@/actions/trips";
import { CreateTripForm } from "@/components/create-trip-form";
import { AuthForm } from "@/components/auth-form";
import { AccountMenu } from "@/components/account-menu";
import { UserTrips } from "@/components/user-trips";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-sm text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Trip Cost Settler
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Paste your group&apos;s expense messages and settle up in seconds.
          </p>
          <div className="mt-10 rounded-2xl border border-border/60 bg-card p-6 shadow-card text-left">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  const trips = await getUserTripsWithSummary();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Trips</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {trips.length > 0
                ? `${trips.length} trip${trips.length === 1 ? "" : "s"}`
                : "Get started by creating a trip"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateTripForm />
            <AccountMenu email={user.email ?? "User"} />
          </div>
        </div>

        <div className="mt-8">
          <UserTrips trips={trips} />
        </div>
      </div>
    </div>
  );
}
