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
    <div className="bg-[#1E1E26] dark:bg-[#1E1E26] w-full min-h-screen flex items-center justify-center">
      <ThemeProvider>
        <div className="w-full h-full flex items-center justify-center max-w-screen-2xl mx-auto">
          {children}
        </div>
      </ThemeProvider>
    </div>
  );
}
