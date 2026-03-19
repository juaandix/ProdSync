
import CreateUserForm from "@/components/form/CreateUserForm";
import PageTitle from "@/components/common/PageTitle";
import { FC } from "react";

const CreateUserPage: FC = () => {
  return (
    <div className="grid grid-cols-12 gap-7.5 w-full">
      <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <PageTitle />
        <div className="border-b border-gray-200 dark:border-gray-800 mb-4 pb-4"></div>
        <CreateUserForm />
      </div>
    </div>
  );
};

export default CreateUserPage;
