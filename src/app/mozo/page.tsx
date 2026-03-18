"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { TableAdminModal } from "@/features/floorplan/components/TableAdminModal";
import { CloseTableModal } from "@/features/floorplan/components/CloseTableModal";
import { OpenTableModal } from "@/features/floorplan/components/OpenTableModal";
import { TableFilters } from "@/features/floorplan/components/TableFilters";
import QROrdersPanel from "@/features/floorplan/components/QROrdersPanel";
import {
  ShoppingCart,
  LayoutGrid,
  ListTodo,
  Pizza,
  Settings,
  Plus,
  WifiOff,
  QrCode,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  zone: Zone | null;
  x: number;
  y: number;
  updatedAt: Date;
  tableGroupId?: string | null;
  tableGroup?: TableGroup | null;
}

const fetchTables = async (): Promise<Table[]> => {
  const response = await fetch("/api/tables");
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Error cargando mesas");
  return result.data;
};

export default function MozoDashboard() {
  const [activeTab, setActiveTab] = useState("mapa");
  const [adminMode, setAdminMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [sortBy, setSortBy] = useState<"number" | "zone" | "capacity">("number");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [closeTableModal, setCloseTableModal] = useState(false);
  const [closingTable, setClosingTable] = useState<Table | null>(null);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [openingTable, setOpeningTable] = useState<Table | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const queryClient = useQueryClient();

  // Detectar estado de conexión
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

  // React Query: carga y cachea las mesas automáticamente
  const {
    data: tables = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    // Refresca cada 15 segundos (reemplaza el polling manual)
    refetchInterval: 15 * 1000,
    // Si pierde internet, no refetch automático hasta que vuelva
    refetchIntervalInBackground: false,
  });

  // Invalidar cache (para que recargue después de acciones)
  const refreshTables = () => {
    queryClient.invalidateQueries({ queryKey: ["tables"] });
  };

  // Filter and sort tables (computed, sin estado separado)
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
        setClosingTable(table);
        setCloseTableModal(true);
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
      setClosingTable(table);
      setCloseTableModal(true);
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

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-screen p-6 border-r border-white/5 flex flex-col gap-8 w-24 shrink-0 bg-slate-900 items-center z-40">
        <div className="bg-brand-primary p-3 rounded-2xl shadow-lg shadow-brand-primary/20">
          <Pizza size={24} className="text-white" />
        </div>

        <div className="flex flex-col gap-6 flex-1 justify-center">
          <button
            onClick={() => setActiveTab("mapa")}
            className={cn(
              "p-4 rounded-xl transition-all",
              activeTab === "mapa"
                ? "bg-white/10 text-brand-primary"
                : "text-slate-500 hover:text-white"
            )}
          >
            <LayoutGrid size={24} />
          </button>
          <button
            onClick={() => setActiveTab("pedidos")}
            className={cn(
              "p-4 rounded-xl transition-all",
              activeTab === "pedidos"
                ? "bg-white/10 text-brand-primary"
                : "text-slate-500 hover:text-white"
            )}
            title="Pedidos QR"
          >
            <QrCode size={24} />
          </button>
          <button
            onClick={() => setAdminMode(!adminMode)}
            className={cn(
              "p-4 rounded-xl transition-all",
              adminMode
                ? "bg-brand-primary text-white"
                : "text-slate-500 hover:text-white"
            )}
            title="Modo Administración"
          >
            <Settings size={24} />
          </button>
        </div>

        {/* Indicador de conexión */}
        {!isOnline && (
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400" title="Sin conexión">
            <WifiOff size={20} />
          </div>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-4 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Cerrar sesión"
        >
          <LogOut size={24} />
        </button>
      </nav>

      <main className="ml-24 mr-0 xl:mr-80 flex-1 h-screen overflow-y-auto p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">
              MAPA DE SALÓN
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
              {!isOnline
                ? "Sin conexión — mostrando datos guardados"
                : adminMode
                ? "Modo Administración Activo"
                : "Sincronización en tiempo real activa"}
            </p>
          </div>

          <div className="flex gap-4">
            {adminMode && (
              <button
                onClick={handleNewTable}
                className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-brand-primary/20 transition-colors"
              >
                <Plus size={20} className="text-brand-primary" />
                <span className="font-bold text-sm">NUEVA MESA</span>
              </button>
            )}
            <div className="glass-card px-6 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="font-bold text-sm">{libreCount} LIBRES</span>
            </div>
            {criticalCount > 0 && (
              <div className="glass-card px-6 py-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                <span className="font-bold text-sm">{criticalCount} CRÍTICAS</span>
              </div>
            )}
          </div>
        </header>

        {/* Banner offline */}
        {!isOnline && (
          <div className="mb-6 glass-card border border-amber-500/30 bg-amber-500/10 px-5 py-3 flex items-center gap-3 text-amber-300">
            <WifiOff size={18} />
            <p className="text-sm font-bold">
              Sin conexión a internet. Estás viendo el último estado guardado.
            </p>
          </div>
        )}

        {/* Filters */}
        {activeTab === "mapa" && !adminMode && (
          <div className="mb-6">
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

        {isLoading && tables.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          </div>
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
          <QROrdersPanel />
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-80 border-l border-white/5 bg-slate-900/50 p-6 hidden xl:block overflow-y-auto z-40">
        <h2 className="font-black italic text-xl mb-6 flex items-center gap-2">
          <ShoppingCart size={20} className="text-brand-primary" />
          QUICK-ADD
        </h2>

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Lo más vendido
          </p>
          {["Pinta IPA", "Fernet", "Gintonic", "Nachos"].map((item) => (
            <button
              key={item}
              className="w-full glass-card p-4 text-left font-bold hover:bg-white/10 transition-colors flex justify-between items-center group"
            >
              {item}
              <span className="bg-brand-primary w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                +
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Table Admin Modal */}
      <TableAdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        table={editingTable}
        onSuccess={refreshTables}
      />

      {/* Close Table Modal */}
      <CloseTableModal
        isOpen={closeTableModal}
        onClose={() => setCloseTableModal(false)}
        table={closingTable}
        onSuccess={refreshTables}
      />

      {/* Open Table Modal */}
      <OpenTableModal
        isOpen={openTableModal}
        onClose={() => setOpenTableModal(false)}
        table={openingTable}
        onSuccess={refreshTables}
      />
    </div>
  );
}
