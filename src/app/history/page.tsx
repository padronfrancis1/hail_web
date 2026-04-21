import { InspectionGrid } from "@/components/history/InspectionGrid";

export const metadata = {
  title: "Inspection History — Hail Detect",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Inspection History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All past inspections are stored locally in your browser.
        </p>
      </div>
      <InspectionGrid />
    </div>
  );
}
