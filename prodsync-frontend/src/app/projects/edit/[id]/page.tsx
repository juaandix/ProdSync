import EditProjectForm from "@/components/form/EditProjectForm";
import { ReactElement } from "react";

// En Next.js 15, 'params' es un Promise<{ id: string }>
export default async function EditProjectPage(props: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  // 1. Esperamos a que se resuelva la promesa de params
  const params = await props.params;

  return (
    <div className="mx-auto max_w_7xl">
      <div className="mt-7.5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
          Edit Project
        </h2>
        <EditProjectForm id={params.id} />
      </div>
    </div>
  );
}