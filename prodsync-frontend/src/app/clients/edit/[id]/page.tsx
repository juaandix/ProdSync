import EditClientForm from "@/components/form/EditClientForm";
import FormPage from "@/components/form/FormPage";
import { ReactElement } from "react";

export default async function EditClientPage(props: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const params = await props.params;

  return (
    <FormPage title="Editar cliente" subtitle="Datos fiscales y de contacto de la empresa" backHref={`/clients/${params.id}`}>
      <EditClientForm id={params.id} />
    </FormPage>
  );
}
