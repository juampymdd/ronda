"use client";

import React, { useState, useEffect } from "react";
import { Activity, AlertCircle } from "lucide-react";
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
  status: string;
  zone: Zone | null;
}

export function LiveMonitor() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    try {
      const response = await fetch("/api/tables");
      const result = await response.json();
      if (result.success) {
        setTables(result.data);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    LIBRE: "bg-emerald-500",
    OCUPADA: "bg-amber-500",
    PIDIENDO: "bg-sky-500",
    ESPERANDO: "bg-rose-500 animate-pulse",
    PAGANDO: "bg-violet-500",
  };

  const zoneGroups = tables.reduce(
    (acc, table) => {
      const zoneName = table.zone?.name || "SIN ZONA";
      if (!acc[zoneName]) acc[zoneName] = [];
      acc[zoneName].push(table);
      return acc;
    },
    {} as Record<string, Table[]>,
  );

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black italic flex items-center gap-2">
          <Activity size={20} className="text-purple-500" />
          MONITOR EN VIVO
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Actualización automática
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(zoneGroups).map(([zone, zoneTables]) => (
            <div key={zone}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                {zone}
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {zoneTables.map((table) => (
                  <div
                    key={table.id}
                    className="aspect-square flex flex-col items-center justify-center bg-white/5 rounded-lg border border-white/10 relative overflow-hidden group hover:border-purple-500 transition-colors"
                  >
                    <div
                      className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        statusColors[table.status] || "bg-gray-500",
                      )}
                    />
                    <span className="text-xs font-bold text-slate-400">M</span>
                    <span className="text-lg font-black">{table.number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-4">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-xs font-bold text-slate-400">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
