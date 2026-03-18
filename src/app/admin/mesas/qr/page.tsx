import { prisma } from "@/lib/prisma";
import QRPanel from "./QRPanel";

export const dynamic = "force-dynamic";

export default async function MesasQRPage() {
  const tables = await prisma.table.findMany({
    include: { zone: true },
    orderBy: { number: "asc" },
  });

  const serialized = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    status: t.status,
    zoneName: t.zone?.name ?? null,
    zoneColor: t.zone?.color ?? "#a855f7",
  }));

  return <QRPanel tables={serialized} />;
}
