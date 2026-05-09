import ViewUserCard from "@/components/user-profile/ViewUserCard";

export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ViewUserCard id={id} />;
}
