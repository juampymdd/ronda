"use client";

import React, { useState } from "react";
import { TableStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Users, Clock, MapPin, Edit, Link2, Unlink } from "lucide-react";
import { GroupTablesModal } from "@/components/GroupTablesModal";

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

interface Props {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableContextMenu?: (table: Table, e: React.MouseEvent) => void;
  adminMode?: boolean;
  onPositionUpdate?: () => void;
  selectedZoneFilter?: string; // "TODAS" or zone name
  onRefresh?: () => void;
}

const statusColors: Record<TableStatus, string> = {
  LIBRE:
    "bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20",
  RESERVADA:
    "bg-purple-500/10 border-purple-500 text-purple-500 hover:bg-purple-500/20",
  OCUPADA:
    "bg-amber-500/10 border-amber-500 text-amber-500 hover:bg-amber-500/20",
  PIDIENDO: "bg-sky-500/10 border-sky-500 text-sky-500 hover:bg-sky-500/20",
  ESPERANDO:
    "bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20",
  PAGANDO:
    "bg-violet-500/10 border-violet-500 text-violet-500 hover:bg-violet-500/20",
};

const statusLabels: Record<TableStatus, string> = {
  LIBRE: "Libre",
  RESERVADA: "Reservada",
  OCUPADA: "Ocupada",
  PIDIENDO: "Pidiendo",
  ESPERANDO: "Esperando",
  PAGANDO: "Pagando",
};

export function InteractiveFloorPlan({
  tables,
  onTableClick,
  onTableContextMenu,
  adminMode = false,
  onPositionUpdate,
  selectedZoneFilter = "TODAS",
  onRefresh,
}: Props) {
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [ungroupLoading, setUngroupLoading] = useState<string | null>(null);

  // Get unique zones from tables
  const zones = Array.from(
    new Map(
      tables.filter((t) => t.zone).map((t) => [t.zone!.id, t.zone!]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Get unique table groups
  const tableGroups = Array.from(
    new Map(
      tables
        .filter((t) => t.tableGroup)
        .map((t) => [t.tableGroup!.id, t.tableGroup!]),
    ).values(),
  );

  const getTimeInStatus = (updatedAt: Date) => {
    const minutes = Math.floor(
      (new Date().getTime() - new Date(updatedAt).getTime()) / 60000,
    );
    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleUngroupTables = async (groupId: string) => {
    if (!confirm("¿Desea separar estas mesas?")) return;

    setUngroupLoading(groupId);
    try {
      const response = await fetch(`/api/table-groups/${groupId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || "Error al separar mesas");
        return;
      }

      onRefresh?.();
    } catch (err) {
      console.error("Error ungrouping tables:", err);
      alert("Error al separar mesas");
    } finally {
      setUngroupLoading(null);
    }
  };

  const TableCard = ({
    table,
    showZone = false,
  }: {
    table: Table;
    showZone?: boolean;
  }) => {
    const isWaitingTooLong =
      table.status === "ESPERANDO" &&
      new Date().getTime() - new Date(table.updatedAt).getTime() >
        15 * 60 * 1000;

    const isGrouped = !!table.tableGroupId;
    const groupName =
      table.tableGroup?.name ||
      `Mesa ${tables
        .filter((t) => t.tableGroupId === table.tableGroupId)
        .map((t) => t.number)
        .sort((a, b) => a - b)
        .join("+")}`;

    return (
      <button
        onClick={() => onTableClick(table)}
        onContextMenu={(e) => {
          e.preventDefault();
          onTableContextMenu?.(table, e);
        }}
        className={cn(
          "group relative rounded-xl border-2 p-4 transition-all duration-200",
          "flex flex-col gap-3 text-left",
          "hover:scale-[1.02] active:scale-95",
          statusColors[table.status],
          isWaitingTooLong && "ring-4 ring-red-600/30 animate-pulse",
          isGrouped && "ring-2 ring-purple-500/50",
        )}
      >
        {/* Group Badge */}
        {isGrouped && (
          <div className="absolute -top-2 -left-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <Link2 size={12} />
              <span>{groupName}</span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className={cn("absolute top-2 right-2", isGrouped && "top-4")}>
          <div className="px-2 py-0.5 rounded-md bg-current/20 text-[10px] font-bold uppercase tracking-wider">
            {statusLabels[table.status]}
          </div>
        </div>

        {/* Table Number */}
        <div
          className={cn(
            "text-4xl font-black leading-none",
            isGrouped && "mt-6",
          )}
        >
          {table.number}
        </div>

        {/* Zone (only in "TODAS" view) */}
        {showZone && table.zone && (
          <div className="flex items-center gap-1.5 text-xs opacity-60">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: table.zone.color }}
            />
            <span>{table.zone.name}</span>
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between text-xs opacity-75 gap-2">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">{table.capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">
              {getTimeInStatus(table.updatedAt)}
            </span>
          </div>
        </div>

        {/* Admin Edit Button */}
        {adminMode && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1.5 rounded-md bg-white/10 backdrop-blur-sm">
              <Edit className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Waiting Alert */}
        {isWaitingTooLong && (
          <div className="absolute -top-1 -left-1 bg-red-600 text-white p-1 rounded-full animate-bounce shadow-lg">
            <Clock className="w-3 h-3" />
          </div>
        )}

        {/* Status Indicator */}
        {table.status !== "LIBRE" && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-current shadow-lg" />
        )}
      </button>
    );
  };

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="w-16 h-16 text-white/20 mb-4" />
        <p className="text-white/60 text-lg">No hay zonas configuradas</p>
        <p className="text-white/40 text-sm mt-2">
          Crea zonas desde la sección de administración
        </p>
      </div>
    );
  }

  // Show all zones in grid layout (Kanban style)
  if (selectedZoneFilter === "TODAS") {
    return (
      <>
        {/* Action Buttons */}
        {adminMode && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20"
            >
              <Link2 size={18} />
              Juntar Mesas
            </button>

            {tableGroups.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{tableGroups.length} grupo(s) activo(s)</span>
              </div>
            )}
          </div>
        )}

        {/* Table Groups Section */}
        {tableGroups.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Link2 size={16} />
              Mesas Agrupadas
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {tableGroups.map((group) => {
                const groupTables = tables.filter(
                  (t) => t.tableGroupId === group.id,
                );
                const totalCapacity = groupTables.reduce(
                  (sum, t) => sum + t.capacity,
                  0,
                );
                const groupName =
                  group.name ||
                  `Mesa ${groupTables
                    .map((t) => t.number)
                    .sort((a, b) => a - b)
                    .join("+")}`;

                return (
                  <div
                    key={group.id}
                    className="glass-card border-2 border-purple-500/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link2 size={16} className="text-purple-400" />
                          <span className="font-black text-purple-400">
                            {groupName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Users size={12} />
                          <span>{totalCapacity} personas total</span>
                        </div>
                      </div>
                      {adminMode && (
                        <button
                          onClick={() => handleUngroupTables(group.id)}
                          disabled={ungroupLoading === group.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/30 transition-all disabled:opacity-50"
                        >
                          <Unlink size={12} />
                          {ungroupLoading === group.id
                            ? "Separando..."
                            : "Separar"}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupTables.map((table) => (
                        <div
                          key={table.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: table.zone?.color || "#6b7280",
                            }}
                          />
                          <span className="font-bold">Mesa {table.number}</span>
                          <span className="text-slate-400">
                            ({table.capacity}p)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Zones Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {zones.map((zone) => {
            const zoneTables = tables.filter((t) => t.zone?.id === zone.id);
            const totalCapacity = zoneTables.reduce(
              (sum, t) => sum + t.capacity,
              0,
            );
            const occupiedCount = zoneTables.filter(
              (t) => t.status !== "LIBRE",
            ).length;

            return (
              <div
                key={zone.id}
                className="rounded-xl border-2 overflow-hidden"
                style={{
                  backgroundColor: `${zone.color}10`,
                  borderColor: `${zone.color}40`,
                }}
              >
                {/* Zone Header */}
                <div
                  className="p-4 border-b-2"
                  style={{
                    backgroundColor: `${zone.color}20`,
                    borderColor: `${zone.color}40`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span
                      className="font-black text-xl"
                      style={{ color: zone.color }}
                    >
                      {zone.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {totalCapacity}/{zone.capacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{occupiedCount} ocupadas</span>
                    </div>
                  </div>
                </div>

                {/* Tables Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {zoneTables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        showZone={false}
                      />
                    ))}
                  </div>

                  {zoneTables.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MapPin className="w-8 h-8 text-white/20 mb-2" />
                      <p className="text-white/40 text-xs">Sin mesas</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Group Tables Modal */}
        <GroupTablesModal
          isOpen={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          tables={tables}
          onSuccess={onRefresh}
        />
      </>
    );
  }

  // Show single zone in grid layout
  const selectedZone = zones.find((z) => z.name === selectedZoneFilter);
  if (!selectedZone) return null;

  const zoneTables = tables.filter((t) => t.zone?.id === selectedZone.id);
  const totalCapacity = zoneTables.reduce((sum, t) => sum + t.capacity, 0);
  const occupiedCount = zoneTables.filter((t) => t.status !== "LIBRE").length;

  return (
    <>
      <div className="space-y-6">
        {/* Action Buttons */}
        {adminMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20"
            >
              <Link2 size={18} />
              Juntar Mesas
            </button>

            {tableGroups.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{tableGroups.length} grupo(s) activo(s)</span>
              </div>
            )}
          </div>
        )}

        {/* Zone Header & Stats */}
        <div
          className="rounded-xl border-2 overflow-hidden"
          style={{
            backgroundColor: `${selectedZone.color}10`,
            borderColor: `${selectedZone.color}40`,
          }}
        >
          <div
            className="p-6 border-b-2"
            style={{
              backgroundColor: `${selectedZone.color}20`,
              borderColor: `${selectedZone.color}40`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: selectedZone.color }}
                  />
                  <span
                    className="font-black text-2xl"
                    style={{ color: selectedZone.color }}
                  >
                    {selectedZone.name}
                  </span>
                  <span className="text-lg text-white/60">
                    {zoneTables.length} mesas
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {totalCapacity} / {selectedZone.capacity} personas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{occupiedCount} ocupadas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {zoneTables.map((table) => (
            <TableCard key={table.id} table={table} showZone={false} />
          ))}
        </div>

        {zoneTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/60 text-lg">No hay mesas en esta zona</p>
            <p className="text-white/40 text-sm mt-2">
              Crea mesas desde el modo administración
            </p>
          </div>
        )}

        {/* Capacity Warning */}
        {totalCapacity > selectedZone.capacity && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400 text-sm flex items-center gap-3">
            <Users className="w-5 h-5" />
            <span>
              ⚠️ La capacidad total de las mesas ({totalCapacity}) excede la
              capacidad de la zona ({selectedZone.capacity})
            </span>
          </div>
        )}
      </div>

      {/* Group Tables Modal */}
      <GroupTablesModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        tables={tables}
        onSuccess={onRefresh}
      />
    </>
  );
}
