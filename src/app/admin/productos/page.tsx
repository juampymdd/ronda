import { ShoppingBag } from "lucide-react";

export default function ProductosPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter">
          PRODUCTOS
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
          Gestiona el menú y precios
        </p>
      </div>

      <div className="glass-card p-12 text-center">
        <ShoppingBag size={64} className="mx-auto text-purple-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">PRÓXIMAMENTE</h2>
        <p className="text-slate-400">
          Gestión de productos, categorías y precios
        </p>
      </div>
    </div>
  );
}
