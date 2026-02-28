"use client";

import React, { useState, useEffect } from "react";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { TableAdminModal } from "@/features/floorplan/components/TableAdminModal";
import { CloseTableModal } from "@/features/floorplan/components/CloseTableModal";
import { TableFilters } from "@/features/floorplan/components/TableFilters";
import {
  ShoppingCart,
  LayoutGrid,
  ListTodo,
  Pizza,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStatus } from "@prisma/client";

interface Zone {
  id: string;
  name: string;
  color: string;
  capacity: number;
  width: number;
  height: number;
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
}

export default function MozoDashboard() {
  const [activeTab, setActiveTab] = useState("mapa");
  const [adminMode, setAdminMode] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [selectedZone, setSelectedZone] = useState("TODAS");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [sortBy, setSortBy] = useState<"number" | "zone" | "capacity">(
    "number",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [closeTableModal, setCloseTableModal] = useState(false);
  const [closingTable, setClosingTable] = useState<Table | null>(null);

  // Load tables
  const loadTables = async () => {
    try {
      const response = await fetch("/api/tables");
      const result = await response.json();
      if (result.success) {
        setTables(result.data);
      } else {
        console.error("Failed to load tables:", result.error);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // Filter and sort tables
  useEffect(() => {
    let filtered = [...tables];

    // Filter by zone
    if (selectedZone !== "TODAS") {
      filtered = filtered.filter((t) => t.zone?.name === selectedZone);
    }

    // Filter by status
    if (selectedStatus !== "TODOS") {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "number") return a.number - b.number;
      if (sortBy === "zone")
        return (a.zone?.name || "").localeCompare(b.zone?.name || "");
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return 0;
    });

    setFilteredTables(filtered);
  }, [tables, selectedZone, selectedStatus, sortBy]);

  const handleTableClick = (table: Table) => {
    if (adminMode) {
      setEditingTable(table);
      setModalOpen(true);
    } else {
      // Open close table modal if table is not free
      if (table.status !== "LIBRE") {
        setClosingTable(table);
        setCloseTableModal(true);
      } else {
        // TODO: Start new ronda
        console.log("Iniciar nueva ronda para mesa", table.number);
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
    }
  };

  const handleNewTable = () => {
    setEditingTable(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadTables();
  };

  const handleCloseTableSuccess = () => {
    loadTables();
  };

  const libreCount = tables.filter((t) => t.status === "LIBRE").length;
  const criticalCount = tables.filter(
    (t) =>
      t.status === "ESPERANDO" &&
      new Date().getTime() - new Date(t.updatedAt).getTime() > 15 * 60 * 1000,
  ).length;

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) - Fixed */}
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
                : "text-slate-500 hover:text-white",
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
                : "text-slate-500 hover:text-white",
            )}
          >
            <ListTodo size={24} />
          </button>
          <button
            onClick={() => setAdminMode(!adminMode)}
            className={cn(
              "p-4 rounded-xl transition-all",
              adminMode
                ? "bg-brand-primary text-white"
                : "text-slate-500 hover:text-white",
            )}
            title="Modo Administración"
          >
            <Settings size={24} />
          </button>
        </div>
      </nav>

      <main className="ml-24 mr-0 xl:mr-80 flex-1 h-screen overflow-y-auto p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">
              MAPA DE SALÓN
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
              {adminMode
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
                <span className="font-bold text-sm">
                  {criticalCount} CRÍTICAS
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Filters */}
        {activeTab === "mapa" && !adminMode && (
          <div className="mb-6">
            <TableFilters
              zones={Array.from(
                new Map(
                  tables
                    .filter((t) => t.zone)
                    .map((t) => [t.zone!.id, t.zone!]),
                ).values(),
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

        {activeTab === "mapa" ? (
          <InteractiveFloorPlan
            tables={tables}
            onTableClick={handleTableClick}
            onTableContextMenu={handleTableContextMenu}
            adminMode={adminMode}
            onPositionUpdate={loadTables}
            selectedZoneFilter={selectedZone}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pedidos view could list active rondas */}
            <p className="text-slate-500 col-span-full text-center py-20 italic">
              No hay pedidos pendientes en tu zona.
            </p>
          </div>
        )}
      </main>

      {/* Right Sidebar: Quick Actions Bar (Desktop only) - Fixed */}
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
        onSuccess={handleModalSuccess}
      />

      {/* Close Table Modal */}
      <CloseTableModal
        isOpen={closeTableModal}
        onClose={() => setCloseTableModal(false)}
        table={closingTable}
        onSuccess={handleCloseTableSuccess}
      />
    </div>
  );
}
