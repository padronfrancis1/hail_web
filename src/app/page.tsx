import { DropZone } from "@/components/upload/DropZone";
import { Separator } from "@/components/ui/separator";
import { Upload, Cpu, ClipboardCheck } from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "1",
    title: "Upload",
    description:
      "Drag and drop or browse for a JPEG/PNG photo of the vehicle panel.",
  },
  {
    icon: Cpu,
    step: "2",
    title: "Analyze",
    description:
      "Our Mask R-CNN model running on Cloud Run detects and segments every dent in seconds.",
  },
  {
    icon: ClipboardCheck,
    step: "3",
    title: "Review",
    description:
      "See an annotated overlay with confidence scores. Export the result or revisit from History.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 bg-gradient-to-b from-slate-50 to-white px-4 pt-16 pb-12 text-center sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
          AI-powered · Mask R-CNN · Cloud inference
        </div>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Detect hail damage{" "}
          <span className="text-red-500">in seconds</span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Upload a photo of any vehicle panel and get instant AI-powered hail
          dent detection with polygon-level precision — no specialist required.
        </p>

        {/* Upload zone */}
        <div className="w-full max-w-lg">
          <DropZone />
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section className="mx-auto w-full max-w-4xl px-4 py-14">
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <Icon className="size-6 text-muted-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
