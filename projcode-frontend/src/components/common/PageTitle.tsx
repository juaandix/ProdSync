"use client";
import { usePathname } from "next/navigation";
import React from "react";

const segmentMap: { [key: string]: string } = {
  "users": "Users",
  "clients": "Clients",
  "projects": "Projects",
  "dashboard": "Dashboard",
};

const formatSegment = (segment: string) => {
  if (segmentMap[segment]) {
    return segmentMap[segment];
  }
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PageTitle: React.FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  if (pathSegments.length === 0) {
    return null;
  }

  let title = formatSegment(pathSegments[pathSegments.length - 1]);

  if (pathSegments.includes('create') && pathSegments.length > 1) {
    const parent = formatSegment(pathSegments[pathSegments.length - 2]);
    const singularParent = parent.endsWith('s') ? parent.slice(0, -1) : parent;
    title = `New ${singularParent}`;
  } else if (pathSegments.includes('edit') && pathSegments.length > 2) {
     const parent = formatSegment(pathSegments[pathSegments.length - 3]);
     const singularParent = parent.endsWith('s') ? parent.slice(0, -1) : parent;
     title = `Edit ${singularParent}`;
  } else if (!isNaN(Number(pathSegments[pathSegments.length -1])) && pathSegments.length > 1) {
    // Handles /users/123 -> Users (as title)
    // The breadcrumb will handle the 'View' part if needed
    const parent = formatSegment(pathSegments[pathSegments.length - 2]);
    title = parent;
  }

  return (
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-5">
      {title}
    </h2>
  );
};

export default PageTitle;