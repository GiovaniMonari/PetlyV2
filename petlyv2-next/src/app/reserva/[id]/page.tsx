import { redirect } from 'next/navigation';

type ReservaLegacyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservaLegacyPage({ params }: ReservaLegacyPageProps) {
  const { id } = await params;
  redirect(`/cuidadores/${id}`);
}
