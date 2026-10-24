import CreateClientForm from "@/components/form/CreateClientForm";
import FormPage from "@/components/form/FormPage";

export default function CreateClientPage() {
  return (
    <FormPage title="Nuevo cliente" subtitle="Datos fiscales y de contacto de la empresa" backHref="/clients">
      <CreateClientForm />
    </FormPage>
  );
}
