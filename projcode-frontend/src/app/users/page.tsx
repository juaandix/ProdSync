
import UserTable from '@/app/users/components/UserTable';

const UsersTablePage = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <UserTable />
        </div>
      </div>
    </div>
  );
};

export default UsersTablePage;

