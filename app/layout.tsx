import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Guided Outcome Platform",
  description: "Structured AI-assisted development platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
