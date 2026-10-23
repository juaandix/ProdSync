import { Lexend } from 'next/font/google';
import './globals.css';
import { Toaster } from "sonner";
import type { Metadata } from 'next';

import ClientLayout from '@/components/layout/ClientLayout';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Providers from './providers';

import { AuthProvider } from '@/context/AuthContext';

const lexend = Lexend({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ProdSync',
  description: 'Gestión de proyectos, tareas y horas para equipos de desarrollo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${lexend.className} bg-[#1E1E26] dark:bg-[#1E1E26]`}>
        <Toaster position="top-center" theme="dark" richColors />
        <ThemeProvider>
          <SidebarProvider>
            <AuthProvider>
              <Providers>
                <ClientLayout>{children}</ClientLayout>
              </Providers>
            </AuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
