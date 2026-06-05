import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js Auth Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Auth Page TailAdmin Dashboard Template",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen">
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </div>
  );
}
