import { CreateTripForm } from "@/components/create-trip-form";

export default function HomePage() {
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
          <CreateTripForm />
        </div>
      </div>
    </div>
  );
}
