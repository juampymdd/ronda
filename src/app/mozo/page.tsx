"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { TableAdminModal } from "@/features/floorplan/components/TableAdminModal";
import { OpenTableModal } from "@/features/floorplan/components/OpenTableModal";
import { TableFilters } from "@/features/floorplan/components/TableFilters";
import GlobalOrdersPanel from "@/features/floorplan/components/GlobalOrdersPanel";
import {
  LayoutGrid,
  Pizza,
  Settings,
  Plus,
  WifiOff,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonMozoFloorPlan } from "@/components/skeletons";
import { TableStatus } from "@prisma/client";
import { signOut } from "next-auth/react";

interface Zone {
  id: string;
  name: string;
  color: string;
  capacity: number;
  width: number;
  height: number;
}

interface TableGroup {
  id: string;
  name: string | null;
}

interface OrderStatusSummary {
  listo: number;
  preparando: number;
  pendiente: number;
  entregado: number;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  zone: Zone | null;
  x: number;
  y: number;
  updatedAt: Date;
  openedAt?: Date | string | null;
  tableGroupId?: string | null;
  tableGroup?: TableGroup | null;
  orderStatusSummary?: OrderStatusSummary | null;
}

const fetchTables = async (): Promise<Table[]> => {
  const response = await fetch("/api/tables");
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Error cargando mesas");
  return result.data;
};

export default function MozoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("mapa");
  const [adminMode, setAdminMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [sortBy, setSortBy] = useState<"number" | "zone" | "capacity">("number");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [openingTable, setOpeningTable] = useState<Table | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const {
    data: tables = [],
    isLoading,
  } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  });

  const refreshTables = () => {
    queryClient.invalidateQueries({ queryKey: ["tables"] });
  };

  const filteredTables = React.useMemo(() => {
    let filtered = [...tables];
    if (selectedZone !== "TODAS") {
      filtered = filtered.filter((t) => t.zone?.name === selectedZone);
    }
    if (selectedStatus !== "TODOS") {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }
    filtered.sort((a, b) => {
      if (sortBy === "number") return a.number - b.number;
      if (sortBy === "zone") return (a.zone?.name || "").localeCompare(b.zone?.name || "");
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return 0;
    });
    return filtered;
  }, [tables, selectedZone, selectedStatus, sortBy]);

  const handleTableClick = (table: Table) => {
    if (adminMode) {
      setEditingTable(table);
      setModalOpen(true);
    } else {
      if (table.status !== "LIBRE") {
        router.push(`/mozo/mesa/${table.id}`);
      } else {
        setOpeningTable(table);
        setOpenTableModal(true);
      }
    }
  };

  const handleTableContextMenu = (table: Table, e: React.MouseEvent) => {
    if (adminMode) {
      setEditingTable(table);
      setModalOpen(true);
    } else if (table.status !== "LIBRE") {
      router.push(`/mozo/mesa/${table.id}`);
    } else {
      setOpeningTable(table);
      setOpenTableModal(true);
    }
  };

  const handleNewTable = () => {
    setEditingTable(null);
    setModalOpen(true);
  };

  const libreCount = tables.filter((t) => t.status === "LIBRE").length;
  const criticalCount = tables.filter(
    (t) =>
      t.status === "ESPERANDO" &&
      new Date().getTime() - new Date(t.updatedAt).getTime() > 15 * 60 * 1000
  ).length;

  const navItems = [
    {
      key: "mapa",
      icon: LayoutGrid,
      label: "MAPA",
      onClick: () => setActiveTab("mapa"),
      active: activeTab === "mapa",
    },
    {
      key: "pedidos",
      icon: ShoppingBag,
      label: "PEDIDOS",
      onClick: () => setActiveTab("pedidos"),
      active: activeTab === "pedidos",
    },
    {
      key: "admin",
      icon: Settings,
      label: "ADMIN",
      onClick: () => setAdminMode(!adminMode),
      active: adminMode,
    },
  ];

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">

      {/* ── Sidebar izquierdo — solo desktop (md+) ─────────────────── */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen border-r border-white/10 bg-slate-900/50 flex-col z-40 transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo/Header */}
        <div className={cn("border-b border-white/10 flex items-center gap-3", sidebarCollapsed ? "p-4 justify-center" : "p-6")}>
          <div className="bg-brand-primary p-2.5 rounded-2xl shadow-lg shadow-brand-primary/20 shrink-0">
            <Pizza size={22} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter">MOZO</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Panel de Mesas</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ key, icon: Icon, label, onClick, active }) => (
            <button
              key={key}
              onClick={onClick}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all",
                sidebarCollapsed ? "justify-center" : "",
                active
                  ? key === "admin"
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-white/10 text-brand-primary"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm">{label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Offline indicator */}
        {!isOnline && (
          <div className={cn("mx-3 mb-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-500/20 text-amber-400", sidebarCollapsed ? "justify-center" : "")} title="Sin conexión">
            <WifiOff size={18} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-bold">Sin conexión</span>}
          </div>
        )}

        {/* Collapse toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all", sidebarCollapsed ? "justify-center" : "")}
            title={sidebarCollapsed ? "Expandir" : "Colapsar"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span className="text-sm">Colapsar</span></>}
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={sidebarCollapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all",
              sidebarCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Bottom nav — solo mobile ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-900 border-t border-white/5 flex items-center justify-around px-2 safe-area-inset-bottom">
        {navItems.map(({ key, icon: Icon, label, onClick, active }) => (
          <button
            key={key}
            onClick={onClick}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              active
                ? key === "admin"
                  ? "text-brand-primary"
                  : "text-brand-primary"
                : "text-slate-500"
            )}
          >
            <Icon size={20} />
            <span className="text-[9px] font-bold tracking-widest">{label}</span>
          </button>
        ))}

        {!isOnline ? (
          <div className="flex flex-col items-center gap-1 text-amber-400 px-4 py-2">
            <WifiOff size={20} />
            <span className="text-[9px] font-bold tracking-widest">OFFLINE</span>
          </div>
        ) : null}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 transition-all"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-bold tracking-widest">SALIR</span>
        </button>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className={cn("pb-16 md:pb-0 flex-1 h-screen overflow-y-auto p-4 md:p-8 transition-all duration-300", sidebarCollapsed ? "md:ml-20" : "md:ml-64")}>

        {/* Header */}
        <header className="flex flex-wrap justify-between items-start gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter">
              MAPA DE SALÓN
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
              {!isOnline
                ? "Sin conexión — datos guardados"
                : adminMode
                ? "Modo Administración Activo"
                : "Sincronización en tiempo real activa"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {adminMode && (
              <button
                onClick={handleNewTable}
                className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-brand-primary/20 transition-colors"
              >
                <Plus size={16} className="text-brand-primary" />
                <span className="font-bold text-xs">NUEVA MESA</span>
              </button>
            )}
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="font-bold text-xs">{libreCount} LIBRES</span>
            </div>
            {criticalCount > 0 && (
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-bold text-xs">{criticalCount} CRÍTICAS</span>
              </div>
            )}
          </div>
        </header>

        {/* Banner offline */}
        {!isOnline && (
          <div className="mb-5 glass-card border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3 text-amber-300">
            <WifiOff size={16} />
            <p className="text-sm font-bold">Sin conexión. Estás viendo el último estado guardado.</p>
          </div>
        )}

        {/* Filters */}
        {activeTab === "mapa" && !adminMode && (
          <div className="mb-5">
            <TableFilters
              zones={Array.from(
                new Map(
                  tables
                    .filter((t) => t.zone)
                    .map((t) => [t.zone!.id, t.zone!])
                ).values()
              )}
              selectedZone={selectedZone}
              onZoneChange={setSelectedZone}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        )}

        {/* Content */}
        {isLoading && tables.length === 0 ? (
          <SkeletonMozoFloorPlan />
        ) : activeTab === "mapa" ? (
          <InteractiveFloorPlan
            tables={filteredTables}
            onTableClick={handleTableClick}
            onTableContextMenu={handleTableContextMenu}
            adminMode={adminMode}
            onPositionUpdate={refreshTables}
            selectedZoneFilter={selectedZone}
            onRefresh={refreshTables}
          />
        ) : (
          <GlobalOrdersPanel />
        )}
      </main>

      {/* Modals */}
      <TableAdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        table={editingTable}
        onSuccess={refreshTables}
      />
      <OpenTableModal
        isOpen={openTableModal}
        onClose={() => setOpenTableModal(false)}
        table={openingTable}
        onSuccess={() => {
          setOpenTableModal(false);
          if (openingTable) router.push(`/mozo/mesa/${openingTable.id}`);
        }}
      />
    </div>
  );
}
