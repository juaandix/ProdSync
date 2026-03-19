import { Lexend } from 'next/font/google';
import './globals.css';
import { Toaster } from "sonner";

import ClientLayout from '@/components/layout/ClientLayout';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Providers from './providers';

import { AuthProvider } from '@/context/AuthContext';

const lexend = Lexend({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lexend.className} bg-[#1E1E26] dark:bg-[#1E1E26]`}>
        <Toaster position="top-center" richColors />
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
