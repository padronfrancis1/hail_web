"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Minimal geometric diamond logomark — no weather skeuomorphism */
function LogoMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer diamond */}
      <path
        d="M11 2 L20 11 L11 20 L2 11 Z"
        stroke="oklch(0.62 0.22 25)"
        strokeWidth="1.5"
        fill="oklch(0.62 0.22 25 / 0.12)"
      />
      {/* Inner dot cluster */}
      <circle cx="11" cy="11" r="2.2" fill="oklch(0.62 0.22 25)" />
      <circle cx="11" cy="6.5" r="1" fill="oklch(0.62 0.22 25 / 0.5)" />
      <circle cx="15.5" cy="11" r="1" fill="oklch(0.62 0.22 25 / 0.5)" />
      <circle cx="11" cy="15.5" r="1" fill="oklch(0.62 0.22 25 / 0.5)" />
      <circle cx="6.5" cy="11" r="1" fill="oklch(0.62 0.22 25 / 0.5)" />
    </svg>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Glass navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoMark />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium tracking-tight text-foreground">
                Hail Detect
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
                v1.0
              </span>
            </div>
          </Link>

          {/* Nav links — underline indicator instead of pill */}
          <nav className="flex items-center gap-0.5">
            <Link href="/" className="relative px-3 py-1.5 group">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-colors duration-150",
                  pathname === "/"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Plus className="size-3.5" />
                New Inspection
              </span>
              {pathname === "/" && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-brand rounded-full" />
              )}
            </Link>
            <Link href="/history" className="relative px-3 py-1.5 group">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-colors duration-150",
                  pathname === "/history"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="size-3.5" />
                History
              </span>
              {pathname === "/history" && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-brand rounded-full" />
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      {/* Minimal mono footer */}
      <footer className="border-t border-border/40 py-5">
        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Hail Detect&nbsp;&nbsp;·&nbsp;&nbsp;Mask R-CNN Inference&nbsp;&nbsp;·&nbsp;&nbsp;© 2026
        </p>
      </footer>
    </div>
  );
}
