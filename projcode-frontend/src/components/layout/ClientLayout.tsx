"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { useSidebar } from '@/context/SidebarContext';
import PageBreadCrumb from '../common/PageBreadCrumb'; // Ajusta la ruta si es necesario

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { isExpanded, isHovered } = useSidebar();

  const authRoutes = ['/signin', '/signup', '/reset-password'];

  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  const mainContentMargin = isExpanded || isHovered ? "lg:ml-[210px]" : "lg:ml-[80px]";

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <Backdrop />
      <div className={`relative flex flex-1 flex-col overflow-hidden ${mainContentMargin}`}>
        <AppHeader />
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#1E1E26]">
          <main className="px-4 sm:px-6 pt-4 sm:pt-6">
              <PageBreadCrumb />
              <div className="mx-auto max-w-screen-2xl">
                {children}
              </div>
            </main>
        </div>
      </div>
    </div>
  );
};

export default ClientLayout;
