import Link from "next/link";
import { Pizza, Users, LayoutDashboard, QrCode } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-4xl w-full">
        <div className="bg-brand-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl shadow-brand-primary/40">
          <Pizza size={40} className="text-white" />
        </div>

        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          RONDA
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Sistemas de misión crítica para el caos del alto volumen. <br />
          <span className="text-brand-primary font-bold">Baja latencia. Real-time total. Resiliencia.</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
          <Link
            href="/mozo"
            className="glass-card p-8 flex flex-col items-center gap-4 hover:border-brand-primary transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="bg-white/5 p-4 rounded-full group-hover:bg-brand-primary/20 transition-colors">
              <LayoutDashboard className="text-brand-primary" size={32} />
            </div>
            <div className="text-left">
              <h3 className="font-black italic text-2xl">MOZO DASHBOARD</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión de Salón</p>
            </div>
          </Link>

          <Link
            href="/ronda/1"
            className="glass-card p-8 flex flex-col items-center gap-4 hover:border-brand-secondary transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="bg-white/5 p-4 rounded-full group-hover:bg-brand-secondary/20 transition-colors">
              <QrCode className="text-brand-secondary" size={32} />
            </div>
            <div className="text-left">
              <h3 className="font-black italic text-2xl">CLIENTE (QR)</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Self-Service Ronda</p>
            </div>
          </Link>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5">
          <div className="flex justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
            {/* Tech badges */}
            <span className="font-black tracking-tighter italic">NEXT.JS 16</span>
            <span className="font-black tracking-tighter italic">REACT 19</span>
            <span className="font-black tracking-tighter italic">PRISMA 7</span>
            <span className="font-black tracking-tighter italic">TAILWIND 4</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
