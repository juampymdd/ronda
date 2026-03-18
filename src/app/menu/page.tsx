import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Pizza } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ElementType } from "react";

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as unknown as Record<string, ElementType>)[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}

export const dynamic = "force-dynamic";

export default async function MenuPage() {
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

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      {/* Header */}
      <header className="py-10 text-center">
        <div className="inline-flex items-center justify-center bg-purple-600 p-4 rounded-2xl shadow-lg shadow-purple-600/30 mb-4">
          <Pizza size={36} className="text-white" />
        </div>
        <h1 className="text-5xl font-black italic tracking-tighter">CARTA</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
          Menú del día
        </p>
      </header>

      {categoriesWithProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 italic">
          No hay productos disponibles.
        </div>
      ) : (
        <div className="space-y-10">
          {categoriesWithProducts.map((category) => (
            <section key={category.id}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: category.color + "22" }}
                >
                  <DynamicIcon
                    name={category.icon}
                    size={20}
                    style={{ color: category.color }}
                  />
                </div>
                <h2
                  className="text-xl font-black italic tracking-tight uppercase"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Products */}
              <div className="space-y-3">
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    className="glass-card flex items-center justify-between px-5 py-4"
                  >
                    <span className="font-bold text-sm">{product.name}</span>
                    <span
                      className="font-black text-sm ml-4 shrink-0"
                      style={{ color: category.color }}
                    >
                      {formatMoney(product.price.toNumber())}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
