"use client";

import React, { useState, useEffect } from "react";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { TableAdminModal } from "@/features/floorplan/components/TableAdminModal";
import { Plus } from "lucide-react";
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

export default function ConstruccionPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [filterZone, setFilterZone] = useState<string>("TODAS");

  const uniqueZones = Array.from(
    new Map(
      tables.filter((t) => t.zone).map((t) => [t.zone!.id, t.zone!]),
    ).values(),
  );

  const loadTables = async () => {
    try {
      const response = await fetch("/api/tables");
      const result = await response.json();
      if (result.success) {
        setTables(result.data);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables =
    filterZone === "TODAS"
      ? tables
      : tables.filter((t) => t.zone?.name === filterZone);

  const handleTableClick = (table: Table) => {
    setEditingTable(table);
    setModalOpen(true);
  };

  const handleTableContextMenu = (table: Table, e: React.MouseEvent) => {
    setEditingTable(table);
    setModalOpen(true);
  };

  const handleNewTable = () => {
    setEditingTable(null);
    setModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            CONSTRUCCIÓN
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            Gestiona el layout del salón
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleNewTable}
            className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600 hover:border-purple-600 transition-all"
          >
            <Plus size={20} />
            <span className="font-bold text-sm">NUEVA MESA</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-2 border-purple-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Mesas
          </p>
          <p className="text-3xl font-black mt-2">{tables.length}</p>
        </div>
        <div className="glass-card p-4 border-2 border-blue-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Zonas
          </p>
          <p className="text-3xl font-black mt-2">{uniqueZones.length}</p>
        </div>
        <div className="glass-card p-4 border-2 border-emerald-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Capacidad Total
          </p>
          <p className="text-3xl font-black mt-2">
            {tables.reduce((sum, t) => sum + t.capacity, 0)}
          </p>
        </div>
        <div className="glass-card p-4 border-2 border-amber-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Promedio Cap.
          </p>
          <p className="text-3xl font-black mt-2">
            {tables.length > 0
              ? (
                  tables.reduce((sum, t) => sum + t.capacity, 0) / tables.length
                ).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {/* Zone Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Filtrar Zona:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterZone("TODAS")}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              filterZone === "TODAS"
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            TODAS
          </button>
          {uniqueZones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setFilterZone(zone.name)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                filterZone === zone.name
                  ? "text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-transparent"
              }`}
              style={{
                backgroundColor:
                  filterZone === zone.name ? `${zone.color}40` : undefined,
                borderColor: filterZone === zone.name ? zone.color : undefined,
              }}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-6 border-l-4 border-purple-500">
        <h3 className="font-black text-lg mb-2">💡 GESTIÓN DE MESAS</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>
            • <strong>Click</strong> en una mesa para editarla (número,
            capacidad, zona)
          </li>
          <li>
            • <strong>Click derecho</strong> para opciones rápidas
          </li>
          <li>
            • Las mesas se organizan automáticamente por <strong>zona</strong>
          </li>
          <li>• Usa los filtros para ver zonas específicas</li>
        </ul>
      </div>

      {/* Floor Plan */}
      <InteractiveFloorPlan
        tables={tables}
        onTableClick={handleTableClick}
        onTableContextMenu={handleTableContextMenu}
        adminMode={true}
        onPositionUpdate={loadTables}
        selectedZoneFilter={filterZone}
      />

      {/* Table Admin Modal */}
      <TableAdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        table={editingTable}
        onSuccess={loadTables}
      />
    </div>
  );
}
