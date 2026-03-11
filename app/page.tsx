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
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Trip Cost Settler
          </h1>
          <p className="mt-3 text-muted-foreground">
            Paste your group&apos;s expense messages and settle up in seconds.
          </p>
          <div className="mt-8">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  const trips = await getUserTripsWithSummary();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your Trips</h1>
          <AccountMenu email={user.email ?? "User"} />
        </div>

        <div className="mt-6">
          <CreateTripForm />
        </div>

        <div className="mt-6">
          <UserTrips trips={trips} />
        </div>
      </div>
    </div>
  );
}
