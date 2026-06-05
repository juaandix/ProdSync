import EditClientForm from "@/components/form/EditClientForm";
import { ReactElement } from "react";

export default async function EditClientPage(props: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const params = await props.params;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mt-7.5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white sm:p-6">
        <h2 className="text-2xl font-bold text-black mb-6">
          Edit Client
        </h2>
        <EditClientForm id={params.id} />
      </div>
    </div>
  );
}
