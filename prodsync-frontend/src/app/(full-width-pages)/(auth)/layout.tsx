import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso · ProdSync",
  description: "Accede a tu cuenta de ProdSync",
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
