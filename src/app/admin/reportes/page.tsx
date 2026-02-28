import { BarChart3 } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter">
          REPORTES
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
          Analíticas y estadísticas del negocio
        </p>
      </div>

      <div className="glass-card p-12 text-center">
        <BarChart3 size={64} className="mx-auto text-purple-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">PRÓXIMAMENTE</h2>
        <p className="text-slate-400">
          Reportes de ventas, productos y rendimiento
        </p>
      </div>
    </div>
  );
}
