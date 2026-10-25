import CreateProjectForm from "@/components/form/CreateProjectForm";
import FormPage from "@/components/form/FormPage";

export default function CreateProjectPage() {
  return (
    <FormPage title="Nuevo proyecto" subtitle="Cliente, fechas y estado inicial" backHref="/projects">
      <CreateProjectForm />
    </FormPage>
  );
}
