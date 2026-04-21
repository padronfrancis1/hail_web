import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { InspectionProvider } from "@/context/InspectionContext";
import { PageShell } from "@/components/layout/PageShell";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hail Detect — AI-Powered Hail Damage Inspection",
  description:
    "Upload a photo of your vehicle panel and get instant AI-powered hail dent detection results.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <InspectionProvider>
          <PageShell>{children}</PageShell>
        </InspectionProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
