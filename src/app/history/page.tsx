import { InspectionGrid } from "@/components/history/InspectionGrid";

export const metadata = {
  title: "Inspection History — Hail Detect",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-foreground">
          Inspection History
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Stored locally in your browser&nbsp;·&nbsp;Never uploaded
        </p>
      </div>
      <InspectionGrid />
    </div>
  );
}
