"use client";

import React, { useState } from "react";
import { X, Users, Link2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStatus } from "@prisma/client";

interface Zone {
  id: string;
  name: string;
  color: string;
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  zone: Zone | null;
  tableGroupId?: string | null;
}

interface GroupTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onSuccess?: () => void;
}

export function GroupTablesModal({
  isOpen,
  onClose,
  tables,
  onSuccess,
}: GroupTablesModalProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Filter available tables (LIBRE and not in a group)
  const availableTables = tables.filter(
    (t) => t.status === TableStatus.LIBRE && !t.tableGroupId,
  );

  const selectedTables = availableTables.filter((t) =>
    selectedTableIds.includes(t.id),
  );
  const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId],
    );
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTableIds.length < 2) {
      setError("Debe seleccionar al menos 2 mesas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/table-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableIds: selectedTableIds,
          name: groupName || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Error al crear el grupo");
        return;
      }

      // Success
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Error creating table group:", err);
      setError("Error al crear el grupo de mesas");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTableIds([]);
    setGroupName("");
    setError("");
    onClose();
  };

  // Generate default preview name
  const previewName =
    groupName ||
    (selectedTables.length > 0
      ? `Mesa ${selectedTables
          .map((t) => t.number)
          .sort((a, b) => a - b)
          .join("+")}`
      : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter">
              JUNTAR MESAS
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Selecciona las mesas que quieres agrupar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 flex items-center gap-2">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          {/* Preview Card */}
          {selectedTables.length >= 2 && (
            <div className="glass-card p-4 border-2 border-purple-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Vista previa del grupo
                  </p>
                  <p className="text-2xl font-black text-purple-400">
                    {previewName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Capacidad total
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Users size={20} className="text-purple-400" />
                    <p className="text-2xl font-black text-purple-400">
                      {totalCapacity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optional Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Link2 size={16} />
              Nombre del grupo (opcional)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={`Ej: ${selectedTables.length > 0 ? previewName : "Mesa Principal"}`}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          {/* Table Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
              Seleccionar mesas ({selectedTableIds.length} seleccionadas)
            </label>

            {availableTables.length === 0 ? (
              <div className="glass-card p-8 text-center border border-white/10">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
                <p className="text-slate-400">
                  No hay mesas libres disponibles para agrupar
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Las mesas deben estar libres y no pertenecer a otro grupo
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableTables.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id);
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleToggleTable(table.id)}
                      className={cn(
                        "glass-card p-4 text-left transition-all border-2",
                        isSelected
                          ? "border-purple-500 bg-purple-500/20 scale-105"
                          : "border-white/10 hover:border-purple-500/50 hover:scale-[1.02]",
                      )}
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
                            <p className="text-sm font-bold text-white">
                              Mesa {table.number}
                            </p>
                            <p className="text-xs text-slate-400">
                              {table.zone?.name || "Sin zona"}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={20}
                            className="text-purple-400 flex-shrink-0"
                          />
                        )}
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-slate-800/50 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedTableIds.length < 2}
              className="flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Creando..."
              ) : (
                <>
                  <Link2 size={20} />
                  Juntar Mesas ({selectedTableIds.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
