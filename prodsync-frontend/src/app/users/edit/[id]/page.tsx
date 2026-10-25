import EditUserForm from "@/app/users/components/EditUserForm";
import FormPage from "@/components/form/FormPage";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FormPage title="Editar usuario" subtitle="Datos de la cuenta, rol y estado" backHref={`/users/${id}`}>
      <EditUserForm id={id} />
    </FormPage>
  );
}
