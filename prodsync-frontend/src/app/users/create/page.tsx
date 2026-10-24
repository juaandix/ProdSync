import CreateUserForm from "@/components/form/CreateUserForm";
import FormPage from "@/components/form/FormPage";

export default function CreateUserPage() {
  return (
    <FormPage title="Nuevo usuario" subtitle="Cuenta de acceso, rol y estado" backHref="/users">
      <CreateUserForm />
    </FormPage>
  );
}
