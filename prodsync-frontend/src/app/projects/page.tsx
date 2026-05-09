import ProjectTable from "./components/ProjectTable";

export default function ProjectsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ProjectTable />
      </div>
    </div>
  );
}
