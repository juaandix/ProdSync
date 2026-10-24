"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '@/layout/TopNav';
import PageBreadCrumb from '../common/PageBreadCrumb';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const authRoutes = ['/signin', '/signup', '/reset-password'];
  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen ambient">
      <TopNav />
      <main className="pt-[105px] md:pt-14">
        <div className="px-4 md:px-6 py-6 mx-auto max-w-screen-2xl">
          <PageBreadCrumb />
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
