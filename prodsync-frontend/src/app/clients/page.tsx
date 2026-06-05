import ClientTable from './components/ClientTable';

export default function ClientsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ClientTable />
      </div>
    </div>
  );
}
