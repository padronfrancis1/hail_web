"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudLightning, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <CloudLightning className="size-5 text-red-500" />
            <span className="text-base font-semibold tracking-tight">
              Hail Detect
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                New Inspection
              </Button>
            </Link>
            <Link href="/history">
              <Button
                variant={pathname === "/history" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
              >
                <History className="size-3.5" />
                History
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Powered by Mask R-CNN &nbsp;·&nbsp; © 2026 Hail Detect
      </footer>
    </div>
  );
}
