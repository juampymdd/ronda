"use client";

import React from "react";
import { Filter, SortAsc } from "lucide-react";
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

interface Props {
  zones: Zone[];
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  sortBy: "number" | "zone" | "capacity";
  onSortChange: (sort: "number" | "zone" | "capacity") => void;
}

const STATUSES = [
  "TODOS",
  "LIBRE",
  "OCUPADA",
  "PIDIENDO",
  "ESPERANDO",
  "PAGANDO",
];

export function TableFilters({
  zones,
  selectedZone,
  onZoneChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Zone Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Zona:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onZoneChange("TODAS")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
              selectedZone === "TODAS"
                ? "bg-brand-primary text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
            )}
          >
            TODAS
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onZoneChange(zone.name)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border-2",
                selectedZone === zone.name
                  ? "text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-transparent",
              )}
              style={{
                backgroundColor:
                  selectedZone === zone.name ? `${zone.color}40` : undefined,
                borderColor:
                  selectedZone === zone.name ? zone.color : undefined,
              }}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Estado:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                selectedStatus === status
                  ? "bg-brand-secondary text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <SortAsc size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Ordenar:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "number", label: "Número" },
              { value: "zone", label: "Zona" },
              { value: "capacity", label: "Capacidad" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onSortChange(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                sortBy === value
                  ? "bg-brand-primary text-white"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
