import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  MonitorCheck,
  LayoutDashboard,
  ChefHat,
  Pizza,
  Zap,
  Smartphone,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role;
    switch (role) {
      case "ADMIN":
        redirect("/admin/dashboard");
      case "MOZO":
        redirect("/mozo");
      case "BARMAN":
        redirect("/barra/kds");
      case "COCINERO":
        redirect("/cocina/kds");
      default:
        redirect("/login");
    }
  }

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&display=swap');

        .font-bebas   { font-family: 'Bebas Neue', sans-serif; }
        .font-barlow  { font-family: 'Barlow', sans-serif; }
        .font-barlow-condensed { font-family: 'Barlow Condensed', sans-serif; }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 24s linear infinite;
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .order-row { animation: slideIn 0.5s ease both; }
        .order-row:nth-child(1) { animation-delay: 0.1s; }
        .order-row:nth-child(2) { animation-delay: 0.3s; }
        .order-row:nth-child(3) { animation-delay: 0.5s; }
        .order-row:nth-child(4) { animation-delay: 0.7s; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .float-badge {
          animation: floatY 3s ease-in-out infinite;
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }

        .feat-num {
          position: absolute;
          bottom: -10px; right: 10px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 120px;
          color: rgba(255,255,255,0.025);
          pointer-events: none;
          line-height: 1;
          user-select: none;
        }

        .noise-overlay {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px;
          opacity: 0.35;
        }

        .step-num-bg {
          position: absolute;
          top: 16px; right: 20px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 80px;
          color: rgba(255,255,255,0.04);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .cta-top-line::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #9333ea, #a855f7, #9333ea, transparent);
        }
      `}</style>

      <div
        className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-barlow"
        style={{ fontFamily: "'Barlow', sans-serif" }}
      >
        {/* Noise + blobs */}
        <div className="noise-overlay" />
        <div className="fixed pointer-events-none z-0">
          <div
            className="absolute rounded-full blur-[120px]"
            style={{
              width: 500,
              height: 500,
              background: "rgba(147,51,234,0.12)",
              top: -100,
              left: -100,
            }}
          />
          <div
            className="absolute rounded-full blur-[100px]"
            style={{
              width: 400,
              height: 400,
              background: "rgba(59,130,246,0.07)",
              bottom: "20%",
              right: -80,
            }}
          />
          <div
            className="absolute rounded-full blur-[90px]"
            style={{
              width: 300,
              height: 300,
              background: "rgba(147,51,234,0.06)",
              top: "50%",
              left: "40%",
            }}
          />
        </div>

        {/* ── NAVBAR ── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/85 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Pizza size={16} className="text-white" />
              </div>
              <span
                className="font-bebas text-2xl tracking-[0.15em] text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                RONDA
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {[
                ["#features", "Funciones"],
                ["#how", "Cómo funciona"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-slate-400 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-[0.18em]"
                >
                  {label}
                </a>
              ))}
            </nav>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 transition-all active:scale-95"
            >
              Iniciar sesión →
            </Link>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-purple-500/30 rounded-sm text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Sistema de gestión gastronómica
            </div>

            <h1
              className="uppercase leading-[0.88] tracking-tight mb-6"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontStyle: "italic",
                fontWeight: 900,
                fontSize: "clamp(72px,9vw,108px)",
              }}
            >
              EL SISTEMA QUE
              <br />
              TU BAR{" "}
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px #9333ea",
                }}
              >
                NECESITA
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-10">
              Pedidos por QR, cocina en tiempo real, mesas y reportes. Todo
              integrado, sin papel, sin caos.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2.5 px-7 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xl shadow-purple-600/25 transition-all active:scale-95"
              >
                Empezar gratis
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-7 py-4 border border-white/10 hover:border-white/25 text-slate-400 hover:text-white font-semibold rounded-lg transition-all"
              >
                Ver demo
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-8 border-t border-white/[0.06]">
              {[
                "Sin instalaciones",
                "Funciona en cualquier celular",
                "Configuración en minutos",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2 text-slate-400 text-sm"
                >
                  <CheckCircle2
                    size={13}
                    className="text-emerald-400 shrink-0"
                  />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — KDS mockup */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
              {/* Window chrome */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  KDS — Cocina en tiempo real
                </span>
                <span />
              </div>
              {/* Orders */}
              <div className="p-5 flex flex-col gap-2.5">
                {[
                  {
                    table: "M3",
                    color: "bg-purple-600",
                    name: "Mesa 3 · Ronda #12",
                    items: "2× Milanesa napolitana · 1× Agua",
                    badge: "Nuevo",
                    badgeCls: "bg-red-500/20 text-red-400",
                  },
                  {
                    table: "M7",
                    color: "bg-blue-600",
                    name: "Mesa 7 · Ronda #8",
                    items: "1× Bife de chorizo · 1× Vino tinto",
                    badge: "Preparando",
                    badgeCls: "bg-yellow-500/20 text-yellow-400",
                  },
                  {
                    table: "M1",
                    color: "bg-emerald-600",
                    name: "Mesa 1 · Ronda #5",
                    items: "3× Empanadas · 2× Cerveza",
                    badge: "Listo ✓",
                    badgeCls: "bg-emerald-500/20 text-emerald-400",
                  },
                  {
                    table: "M11",
                    color: "bg-amber-600",
                    name: "Mesa 11 · Ronda #15",
                    items: "1× Pizza muzzarella · 1× Fernet",
                    badge: "Enviado",
                    badgeCls: "bg-slate-500/20 text-slate-400",
                  },
                ].map(({ table, color, name, items, badge, badgeCls }) => (
                  <div
                    key={table}
                    className="order-row flex items-center gap-3 px-3.5 py-3 bg-slate-800/60 rounded-xl border border-white/[0.06]"
                  >
                    <div
                      className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0`}
                    >
                      {table}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {items}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeCls} shrink-0`}
                    >
                      {badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating QR badge */}
            <div className="float-badge absolute -bottom-6 -right-6 bg-slate-900 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="w-11 h-11 bg-white rounded-lg grid grid-cols-5 gap-[2px] p-1.5 shrink-0">
                {[
                  1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1,
                  0, 1, 0, 1,
                ].map((v, i) => (
                  <span
                    key={i}
                    className="rounded-[1px]"
                    style={{ background: v ? "#020817" : "transparent" }}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-bold">Escaneá y pedí</p>
                <p className="text-[11px] text-slate-500">Mesa 7 · Sin app</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="relative z-10 border-y border-white/[0.06] bg-slate-900/50 overflow-hidden py-3.5">
          <div className="ticker-track">
            {[0, 1].map((n) => (
              <div
                key={n}
                className="flex items-center gap-0 whitespace-nowrap"
              >
                {[
                  "Pedidos en tiempo real",
                  "Sin papel",
                  "KDS cocina y barra",
                  "Plano drag-and-drop",
                  "Reportes y estadísticas",
                  "4 roles de usuario",
                  "Multi-zona",
                  "Sin hardware extra",
                  "QR único por mesa",
                ].map((item) => (
                  <span
                    key={item}
                    className="font-bebas text-[17px] tracking-[0.1em] text-slate-500 px-8 flex items-center gap-5"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    <span className="text-purple-500 text-xl">●</span>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden bg-slate-900/40">
            {[
              {
                val: "<1s",
                label: "Latencia de pedidos",
                color: "text-purple-400",
              },
              { val: "0", label: "Apps requeridas", color: "text-blue-400" },
              {
                val: "4",
                label: "Roles de usuario",
                color: "text-emerald-400",
              },
              {
                val: "∞",
                label: "Mesas configurables",
                color: "text-amber-400",
              },
            ].map(({ val, label, color }) => (
              <div key={val} className="py-10 px-8 text-center">
                <div
                  className={`font-bebas text-5xl tracking-wide ${color} mb-1`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {val}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section
          id="features"
          className="relative z-10 max-w-6xl mx-auto px-6 pb-24"
        >
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-4">
            <span className="w-7 h-px bg-purple-500" />
            Funcionalidades
          </div>
          <h2
            className="uppercase leading-[0.88] tracking-tight mb-3"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: "clamp(44px,6vw,72px)",
            }}
          >
            TODO LO QUE{" "}
            <span
              style={{ color: "transparent", WebkitTextStroke: "2px #9333ea" }}
            >
              NECESITÁS
            </span>
          </h2>
          <p className="text-slate-400 text-base max-w-lg mb-14 leading-relaxed">
            Diseñado para el ritmo de un bar. Cada función existe porque
            resuelve un problema real.
          </p>

          {/* Grid asimétrico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Feature grande */}
            <div className="relative overflow-hidden bg-slate-900 p-12 md:row-span-2 hover:bg-slate-900/80 transition-colors">
              <span className="feat-num">01</span>
              <div className="w-13 h-13 w-12 h-12 rounded-xl bg-purple-600/15 flex items-center justify-center mb-6">
                <QrCode size={22} className="text-purple-400" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
                Sin app requerida
              </span>
              <h3
                className="uppercase leading-[1.05] tracking-tight mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 30,
                }}
              >
                Pedidos
                <br />
                por QR
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Los clientes escanean el código de su mesa y piden desde el
                celular. El pedido llega directo a cocina y barra, sin mozo como
                intermediario y sin errores de transcripción.
              </p>
              {/* Mini flow diagram */}
              <div className="bg-slate-800/60 rounded-xl border border-white/[0.06] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">
                  Flujo del pedido
                </p>
                <div className="flex items-center justify-between">
                  {[
                    { emoji: "📱", label: "Cliente\nescanea" },
                    { emoji: "🛒", label: "Elige\ndel menú" },
                    { emoji: "⚡", label: "KDS en\nsegundos" },
                  ].map(({ emoji, label }, i) => (
                    <div key={i} className="flex items-center gap-0 flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-10 h-10 rounded-lg bg-slate-700/60 flex items-center justify-center text-xl mb-2">
                          {emoji}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold text-center whitespace-pre-line leading-tight">
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className="w-6 h-px bg-white/10 mb-5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative overflow-hidden bg-slate-900 p-10 hover:bg-slate-900/80 transition-colors">
              <span className="feat-num">02</span>
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center mb-5">
                <MonitorCheck size={22} className="text-blue-400" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
                Cocina + Barra
              </span>
              <h3
                className="uppercase leading-[1.05] tracking-tight mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 26,
                }}
              >
                KDS en
                <br />
                tiempo real
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Pantallas dedicadas para cocina y barra. Pedidos ordenados por
                prioridad y tiempo de espera. Sin papelitos, sin gritos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative overflow-hidden bg-slate-900 p-10 hover:bg-slate-900/80 transition-colors">
              <span className="feat-num">03</span>
              <div className="w-12 h-12 rounded-xl bg-emerald-600/15 flex items-center justify-center mb-5">
                <LayoutDashboard size={22} className="text-emerald-400" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
                Reportes y estadísticas
              </span>
              <h3
                className="uppercase leading-[1.05] tracking-tight mb-3"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: 26,
                }}
              >
                Dashboard
                <br />
                del admin
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ventas del día, pedidos en curso, historial filtrable. Todo lo
                que necesitás saber de tu local en una vista.
              </p>
            </div>

            {/* Feature 4 — full width */}
            <div className="relative overflow-hidden bg-slate-900 p-10 md:col-span-2 hover:bg-slate-900/80 transition-colors">
              <span className="feat-num">04</span>
              <div className="flex gap-10 items-start">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/15 flex items-center justify-center mb-5">
                    <ChefHat size={22} className="text-amber-400" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
                    Plano interactivo
                  </span>
                  <h3
                    className="uppercase leading-[1.05] tracking-tight"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontStyle: "italic",
                      fontWeight: 900,
                      fontSize: 26,
                    }}
                  >
                    Gestión de
                    <br />
                    mesas y plano
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mt-2 max-w-xl">
                  Plano drag-and-drop, apertura y cierre de rondas, asignación
                  de mozos por zona y seguimiento del estado de cada mesa en
                  tiempo real. Salón, terraza, barra: todo en una vista.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          id="how"
          className="relative z-10 border-t border-white/[0.06] bg-slate-900/30"
        >
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-4">
              <span className="w-7 h-px bg-purple-500" />
              Proceso
            </div>
            <h2
              className="uppercase leading-[0.88] tracking-tight mb-3"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontStyle: "italic",
                fontWeight: 900,
                fontSize: "clamp(44px,6vw,72px)",
              }}
            >
              LISTO EN{" "}
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px #9333ea",
                }}
              >
                MINUTOS
              </span>
            </h2>
            <p className="text-slate-400 text-base max-w-lg mb-14 leading-relaxed">
              Sin técnicos, sin contratos, sin hardware. Abrís una cuenta y en
              el mismo día estás operativo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
              {[
                {
                  n: "01",
                  icon: LayoutDashboard,
                  title: "Configurá\ntu local",
                  desc: "Creá zonas, mesas, categorías y productos. El plano es drag-and-drop y el menú se carga en minutos.",
                },
                {
                  n: "02",
                  icon: QrCode,
                  title: "Generá\nlos QR",
                  desc: "El sistema genera un código QR único por mesa. Lo imprimís, lo ponés en la mesa, listo.",
                },
                {
                  n: "03",
                  icon: Zap,
                  title: "Recibí\nlos pedidos",
                  desc: "Los clientes piden, cocina y barra ven todo en tiempo real. Vos ves el resumen en el dashboard.",
                },
              ].map(({ n, icon: Icon, title, desc }) => (
                <div key={n} className="relative bg-slate-950 p-10">
                  <span className="step-num-bg">{n}</span>
                  <div
                    className="w-11 h-11 rounded-full border-2 border-purple-500/60 flex items-center justify-center font-bebas text-lg text-purple-400 mb-7"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {n}
                  </div>
                  <h3
                    className="uppercase leading-[1.05] tracking-tight mb-3 whitespace-pre-line"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontStyle: "italic",
                      fontWeight: 900,
                      fontSize: 24,
                    }}
                  >
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <div className="cta-top-line relative overflow-hidden bg-slate-900 border border-white/[0.08] rounded-2xl px-10 py-20 text-center">
            {/* Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: 600,
                height: 280,
                background:
                  "radial-gradient(ellipse, rgba(147,51,234,0.15) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-7">
                🍕 RONDA — Sistema gastronómico
              </span>
              <h2
                className="uppercase leading-[0.88] tracking-tight mb-5"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 900,
                  fontSize: "clamp(52px,7vw,88px)",
                }}
              >
                ¿TU BAR
                <br />
                <span className="text-purple-400">ESTÁ LISTO?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                Empezá hoy. Sin tarjeta de crédito, sin instalaciones, sin
                complicaciones.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-9 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-lg shadow-xl shadow-purple-600/25 transition-all active:scale-95"
              >
                Crear cuenta gratis <ArrowRight size={16} />
              </Link>
              <div className="flex flex-wrap justify-center gap-8 mt-10 pt-8 border-t border-white/[0.06]">
                {[
                  "Sin costo inicial",
                  "Sin hardware extra",
                  "Soporte incluido",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 text-slate-400 text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 border-t border-white/[0.06] bg-slate-900/40">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
                <Pizza size={13} className="text-white" />
              </div>
              <span
                className="font-bebas text-xl tracking-[0.15em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                RONDA
              </span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.15em]">
                Sistema gastronómico
              </span>
            </div>
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} Ronda. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
