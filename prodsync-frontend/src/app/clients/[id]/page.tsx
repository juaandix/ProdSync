import ViewClientCard from "@/components/client-profile/ViewClientCard";

export default async function ViewClientPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ViewClientCard id={params.id} />
      </div>
    </div>
  );
}
