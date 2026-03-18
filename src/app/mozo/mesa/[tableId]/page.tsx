import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import MozoMenuClient from "./MozoMenuClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ tableId: string }>;
}

export default async function MozoMesaPage({ params }: Props) {
  const { tableId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const mozoId = (session.user as any).id as string;

  const table = await prisma.table.findUnique({
    where: { id: tableId },
  });

  if (!table) notFound();

  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const categoriesWithProducts = categories.filter((c) => c.products.length > 0);

  // Serialize Decimal → number before passing to Client Component
  const serializedCategories = categoriesWithProducts.map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toNumber(),
      type: p.type,
    })),
  }));

  return (
    <MozoMenuClient
      tableId={table.id}
      tableNumber={table.number}
      tableStatus={table.status}
      mozoId={mozoId}
      categories={serializedCategories}
    />
  );
}
