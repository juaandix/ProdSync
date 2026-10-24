import EditProjectForm from "@/components/form/EditProjectForm";
import FormPage from "@/components/form/FormPage";
import { ReactElement } from "react";

// En Next.js 15, 'params' es un Promise<{ id: string }>
export default async function EditProjectPage(props: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const params = await props.params;

  return (
    <FormPage title="Editar proyecto" subtitle="Cliente, fechas y estado" backHref={`/projects/${params.id}`}>
      <EditProjectForm id={params.id} />
    </FormPage>
  );
}
