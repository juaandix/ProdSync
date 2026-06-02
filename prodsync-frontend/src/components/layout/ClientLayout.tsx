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
    <div className="min-h-screen bg-[#1E1E26]">
      <TopNav />
      <main className="pt-14">
        <div className="px-6 py-6 mx-auto max-w-screen-2xl">
          <div className="mb-4">
            <PageBreadCrumb />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
