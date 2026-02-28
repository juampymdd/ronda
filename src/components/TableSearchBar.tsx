"use client";

import React, { useState } from "react";
import { Search, X, Users, MapPin } from "lucide-react";
import { TableStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

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

interface TableSearchBarProps {
  tables: Table[];
  onSelectTable?: (table: Table) => void;
  showOnlyAvailable?: boolean; // Only show LIBRE or RESERVADA tables
  className?: string;
}

export function TableSearchBar({
  tables,
  onSelectTable,
  showOnlyAvailable = false,
  className,
}: TableSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [minCapacity, setMinCapacity] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique zones
  const zones = Array.from(
    new Map(tables.filter((t) => t.zone).map((t) => [t.zone!.id, t.zone!])).values(),
  );

  // Filter tables
  const filteredTables = tables.filter((table) => {
    // Filter by availability if needed
    if (showOnlyAvailable && table.status !== TableStatus.LIBRE && table.status !== TableStatus.RESERVADA) {
      return false;
    }

    // Filter by search query (table number)
    if (searchQuery && !table.number.toString().includes(searchQuery)) {
      return false;
    }

    // Filter by zone
    if (selectedZone && table.zone?.id !== selectedZone) {
      return false;
    }

    // Filter by minimum capacity
    if (minCapacity && table.capacity < minCapacity) {
      return false;
    }

    return true;
  });

  const handleReset = () => {
    setSearchQuery("");
    setSelectedZone(null);
    setMinCapacity(null);
  };

  const getStatusBadge = (status: TableStatus) => {
    const config = {
      LIBRE: { label: "Libre", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
      RESERVADA: { label: "Reservada", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
      OCUPADA: { label: "Ocupada", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
      PIDIENDO: { label: "Pidiendo", color: "bg-amber-500/20 text-amber-400 border-amber-500/50" },
      ESPERANDO: { label: "Esperando", color: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
      PAGANDO: { label: "Pagando", color: "bg-pink-500/20 text-pink-400 border-pink-500/50" },
    };
    return config[status];
  };

  const hasFilters = searchQuery || selectedZone || minCapacity;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input and Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número de mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "px-4 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all",
            isExpanded
              ? "bg-purple-600 text-white"
              : "bg-slate-800/50 text-slate-400 hover:text-white border border-white/10",
          )}
        >
          Filtros {hasFilters && `(${[searchQuery, selectedZone, minCapacity].filter(Boolean).length})`}
        </button>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-lg font-bold uppercase tracking-wider text-sm bg-slate-800/50 text-slate-400 hover:text-white border border-white/10 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="glass-card p-4 space-y-4 border border-white/10">
          {/* Zone Filter */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              <MapPin size={14} className="inline mr-1" />
              Zona
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedZone(null)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                  !selectedZone
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
                )}
              >
                Todas
              </button>
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                    selectedZone === zone.id
                      ? "text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
                  )}
                  style={
                    selectedZone === zone.id
                      ? {
                          backgroundColor: zone.color,
                          boxShadow: `0 0 15px ${zone.color}40`,
                        }
                      : {}
                  }
                >
                  {zone.name}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity Filter */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              <Users size={14} className="inline mr-1" />
              Capacidad mínima
            </label>
            <div className="flex gap-2 flex-wrap">
              {[2, 4, 6, 8].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setMinCapacity(minCapacity === cap ? null : cap)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    minCapacity === cap
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {cap}+ personas
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="glass-card p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {filteredTables.length} mesa{filteredTables.length !== 1 && "s"} encontrada
            {filteredTables.length !== 1 && "s"}
          </p>
        </div>

        {filteredTables.length === 0 ? (
          <div className="py-8 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-slate-400">No se encontraron mesas con estos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredTables.map((table) => {
              const statusConfig = getStatusBadge(table.status);
              return (
                <button
                  key={table.id}
                  onClick={() => onSelectTable?.(table)}
                  className="glass-card p-4 text-left hover:scale-[1.02] transition-transform border border-white/10 hover:border-purple-500/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black"
                        style={{
                          backgroundColor: table.zone?.color || "#6b7280",
                        }}
                      >
                        {table.number}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Mesa {table.number}</p>
                        <p className="text-xs text-slate-400">{table.zone?.name || "Sin zona"}</p>
                      </div>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs font-bold border", statusConfig.color)}>
                      {statusConfig.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 text-sm">
                    <Users size={14} />
                    <span>{table.capacity} personas</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
