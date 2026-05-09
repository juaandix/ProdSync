'use client';
import ViewProjectCard from '@/components/project-profile/ViewProjectCard';
import ProjectAnalytics from '@/components/project-profile/ProjectAnalytics';
import { useParams } from 'next/navigation';

export default function ViewProjectPage() {
  const { id } = useParams();

  if (!id || typeof id !== 'string') {
    return (
      <div className="animate-pulse space-y-4 mt-4">
        <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mt-4">
          <ViewProjectCard id={id} />
        </div>
      </div>
      <div className="col-span-12">
        <ProjectAnalytics projectId={id} />
      </div>
    </div>
  );
}
