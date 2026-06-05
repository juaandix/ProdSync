import EditUserForm from "@/app/users/components/EditUserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mt-7.5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1E1E26] sm:p-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
          Edit User
        </h2>
        <EditUserForm id={id} />
      </div>
    </div>
  );
}
