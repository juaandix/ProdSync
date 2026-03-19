'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import Badge from '@/components/ui/badge/Badge';

export default function RecentProjectsTable() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const recent = projects.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Projects</h3>
        <Link href="/projects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          View all
        </Link>
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/3" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/4" />
              <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 w-16" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/5" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-4 text-center text-gray-500">No projects found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Client</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recent.map((project) => (
                <tr key={project.id}>
                  <td className="py-2">
                    <Link href={`/projects/${project.id}`} className="font-medium text-gray-800 dark:text-white/90">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">
                    {project.client ? (
                      <Link href={`/clients/${project.client.id}`} className="hover:underline">
                        {project.client.name}
                      </Link>
                    ) : 'N/A'}
                  </td>
                  <td className="py-2">
                    <Badge
                      size="sm"
                      color={
                        project.status === 'COMPLETED'
                          ? 'success'
                          : project.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {project.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">{project.endDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
