"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const segmentMap: { [key: string]: string } = {
  "users": "Users",
  "create": "Create",
  "edit": "Edit",
  "clients": "Clients",
  "projects": "Projects",
  "dashboard": "Dashboard",
};

const PageBreadcrumb: React.FC = () => {
  const pathname = usePathname();
  if (pathname.startsWith('/_next') || pathname === '/' || pathname === '/dashboard') return null;

  const initialSegments = pathname.split('/').filter(segment => segment);
  
  let uniqueSegments: string[] = [];
  // Filtrar segmentos duplicados y asegurar orden correcto
  initialSegments.forEach(segment => {
    if (!uniqueSegments.includes(segment)) {
      uniqueSegments.push(segment);
    }
  });

  // Si estamos en una página de 'edit', truncamos después de 'edit'
  const editIndex = uniqueSegments.indexOf('edit');
  if (editIndex !== -1) {
    uniqueSegments = uniqueSegments.slice(0, editIndex + 1);
  }

  const pathSegments = uniqueSegments;
  const formatSegment = (segment: string) => {
    if (!isNaN(Number(segment))) {
      return "View"; // Muestra 'View' para IDs numéricos en el breadcrumb
    }
    if (segmentMap[segment]) return segmentMap[segment];
    return segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <nav className="mb-0">
      <ol className="flex items-center gap-1.5 justify-start">
        <li>
          <Link className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white" href="/dashboard">
            Home
          </Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;
          const formattedSegment = formatSegment(segment);
          if (!formattedSegment) return null;

          return (
            <li key={href} className="flex items-center">
              <svg className="w-4 h-4 stroke-current text-white/50" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {isLast ? (
                <span className="text-sm text-white ml-1.5">{formattedSegment}</span>
              ) : (
                <Link className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white ml-1.5" href={href}>
                  {formattedSegment}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PageBreadcrumb;

