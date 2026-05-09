'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';

interface ViewProjectCardProps {
  id: string;
}

export default function ViewProjectCard({ id }: ViewProjectCardProps) {
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 rounded bg-gray-200 dark:bg-gray-700 w-1/3" />
        </div>
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-full" />
        <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-3/4" />
        <div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (error) {
    return <div className="p-5 text-center text-red-500">No se pudo cargar el proyecto. Inténtalo de nuevo.</div>;
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-[40px] w-[40px] flex items-center justify-center rounded-md bg-[#1E1E26] text-white font-semibold text-lg flex-shrink-0">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                      </div>          <Badge>{project.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        {/* Client Information Section */}
        {project.client && (
          <div className="pt-4">
            <Link href={`/clients/${project.client.id}`} className="flex items-center gap-3">
              <div className="h-[40px] w-[40px] flex items-center justify-center rounded-full bg-[#1E1E26] text-white font-semibold flex-shrink-0">
                {project.client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {project.client.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project.client.email}
                </p>
              </div>
            </Link>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="font-semibold">Description</h4>
          <p>{project.description || 'No description provided.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <h4 className="font-semibold">Start Date</h4>
            <p>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">End Date</h4>
            <p>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
