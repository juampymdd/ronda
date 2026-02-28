"use client";

import React from "react";
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
  { name: "Productos", href: "/admin/productos", icon: ShoppingBag },
  { name: "Reportes", href: "/admin/reportes", icon: BarChart3 },
];

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside className="fixed left-0 top-0 w-72 h-screen border-r border-white/10 bg-slate-900/50 flex flex-col z-40">
        {/* Logo/Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-600/20">
              <Pizza size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">
                ADMIN
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Panel de Control
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content - Scrollable area with left padding */}
      <main className="ml-72 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
