"use client";

import { DropZone } from "@/components/upload/DropZone";
import { Upload, Cpu, ClipboardCheck, ShieldCheck, Timer, Scan, Lock } from "lucide-react";
import { motion } from "framer-motion";

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload",
    description:
      "Drag and drop or browse for a JPEG photo of the vehicle panel. Images stay in your browser — never stored on our servers.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Analyze",
    description:
      "Our Mask R-CNN model running on Cloud Run detects and segments every dent in seconds with polygon-level precision.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Review",
    description:
      "See an annotated overlay with confidence scores for every detection. Export the result or revisit from History.",
  },
];

const METRICS = [
  {
    icon: ShieldCheck,
    stat: "95%",
    label: "Detection accuracy",
  },
  {
    icon: Timer,
    stat: "~15s",
    label: "Per image",
  },
  {
    icon: Scan,
    stat: "Polygon",
    label: "Precise segmentation",
  },
  {
    icon: Lock,
    stat: "Local",
    label: "Browser-only privacy",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center gap-8 px-4 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        {/* Pill badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            Live&nbsp;·&nbsp;Mask R-CNN inference
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-3xl text-5xl font-medium tracking-[-0.04em] leading-[1.05] sm:text-7xl"
        >
          Find every dent.
          <br />
          <span className="bg-gradient-to-r from-brand to-brand/50 bg-clip-text text-transparent">
            In seconds.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          AI-powered hail damage inspection for insurance adjusters and body
          shops. Upload a photo, get polygon-precise results.
        </motion.p>

        {/* Drop zone — primary CTA */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl"
        >
          <DropZone />
        </motion.div>
      </section>

      {/* ── Metrics strip ── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {METRICS.map(({ icon: Icon, stat, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              custom={0}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 px-4 py-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_4px_24px_oklch(0.62_0.22_25_/_0.08)]"
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="font-mono text-2xl font-medium text-foreground">
                {stat}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <h2 className="mb-12 text-center text-sm font-mono font-medium uppercase tracking-widest text-muted-foreground">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="group relative overflow-hidden rounded-2xl border border-border/50 p-6 transition-all duration-200 hover:border-brand/40 hover:-translate-y-0.5"
            >
              {/* Faded step number glyph behind content */}
              <span
                className="pointer-events-none absolute -top-3 -right-1 select-none font-mono text-[80px] font-bold leading-none text-foreground/[0.04]"
                aria-hidden
              >
                {step}
              </span>

              <div className="relative flex flex-col gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sample preview placeholder ── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="aspect-video w-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Scan className="size-8 text-muted-foreground/40" />
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/40">
              Sample inspection preview
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
