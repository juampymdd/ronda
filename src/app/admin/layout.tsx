"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Hammer,
  MapPin,
  Users,
  ShoppingBag,
  BarChart3,
  Pizza,
  LogOut,
  Tag,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Construcción", href: "/admin/construccion", icon: Hammer },
  { name: "Zonas", href: "/admin/zonas", icon: MapPin },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Categorías", href: "/admin/categorias", icon: Tag },
  { name: "Productos", href: "/admin/productos", icon: ShoppingBag },
  { name: "Mesas QR", href: "/admin/mesas/qr", icon: QrCode },
  { name: "Reportes", href: "/admin/reportes", icon: BarChart3 },
];

// Items shown in mobile bottom nav (most frequently used)
const bottomNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/productos", icon: ShoppingBag },
  { name: "Reportes", href: "/admin/reportes", icon: BarChart3 },
];

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">

      {/* ── Sidebar — solo desktop (md+) ──────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen border-r border-white/10 bg-slate-900/50 flex-col z-40 transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-72",
        )}
      >
        {/* Logo/Header */}
        <div
          className={cn(
            "border-b border-white/10 flex items-center gap-3",
            sidebarCollapsed ? "p-4 justify-center" : "p-6",
          )}
        >
          <div className="bg-purple-600 p-2.5 rounded-2xl shadow-lg shadow-purple-600/20 shrink-0">
            <Pizza size={22} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">ADMIN</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Panel de Control
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all",
                  sidebarCollapsed ? "justify-center" : "",
                  active
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir" : "Colapsar"}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all",
              sidebarCollapsed ? "justify-center" : "",
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-sm">Colapsar</span>
              </>
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={sidebarCollapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all",
              sidebarCollapsed ? "justify-center" : "",
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Bottom nav — solo mobile ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-900 border-t border-white/10 flex items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                active ? "text-purple-400" : "text-slate-500",
              )}
            >
              <Icon size={20} />
              <span className="text-[9px] font-bold tracking-widest uppercase">
                {item.name}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-bold tracking-widest uppercase">Salir</span>
        </button>
      </nav>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main
        className={cn(
          "flex-1 h-screen overflow-y-auto pb-16 md:pb-0 transition-all duration-300",
          sidebarCollapsed ? "md:ml-20" : "md:ml-72",
        )}
      >
        {children}
      </main>
    </div>
  );
}
