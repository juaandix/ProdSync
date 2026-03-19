import CreateProjectForm from "@/components/form/CreateProjectForm";
import PageTitle from "@/components/common/PageTitle";

export default function CreateProjectPage() {
  return (
    <div className="mt-7.5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <PageTitle />
        <div className="border-b border-gray-200 dark:border-gray-800 mb-4 pb-4"></div>
        <CreateProjectForm />
      </div>
  );
}

