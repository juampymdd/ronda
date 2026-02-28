"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { getZonesAction, deleteZoneAction } from "@/actions/zoneActions";
import { ZoneModal } from "@/features/admin/components/ZoneModal";

interface Zone {
  id: string;
  name: string;
  color: string;
  capacity: number;
  width: number;
  height: number;
  createdAt: Date;
  _count: {
    tables: number;
  };
}

export default function ZonasPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const loadZones = async () => {
    setLoading(true);
    const result = await getZonesAction();
    if (result.success) {
      setZones(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleDelete = async (zoneId: string) => {
    if (!confirm("¿Eliminar esta zona?")) return;

    const result = await deleteZoneAction(zoneId);
    if (result.success) {
      loadZones();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">ZONAS</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            Organiza el diseño del salón
          </p>
        </div>

        <button
          onClick={() => {
            setEditingZone(null);
            setModalOpen(true);
          }}
          className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-purple-600 hover:border-purple-600 transition-all"
        >
          <Plus size={20} />
          <span className="font-bold text-sm">NUEVA ZONA</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-2 border-purple-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Zonas
          </p>
          <p className="text-3xl font-black mt-2">{zones.length}</p>
        </div>
        <div className="glass-card p-4 border-2 border-blue-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Mesas
          </p>
          <p className="text-3xl font-black mt-2">
            {zones.reduce((sum, z) => sum + z._count.tables, 0)}
          </p>
        </div>
        <div className="glass-card p-4 border-2 border-emerald-500/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Promedio Mesas/Zona
          </p>
          <p className="text-3xl font-black mt-2">
            {zones.length > 0
              ? (
                  zones.reduce((sum, z) => sum + z._count.tables, 0) /
                  zones.length
                ).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500 col-span-full text-center py-12">
            Cargando...
          </p>
        ) : zones.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <MapPin
              size={64}
              className="mx-auto text-purple-500 mb-4 opacity-50"
            />
            <h3 className="text-xl font-black mb-2">No hay zonas creadas</h3>
            <p className="text-slate-400 mb-6">
              Crea tu primera zona para organizar el salón
            </p>
            <button
              onClick={() => {
                setEditingZone(null);
                setModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Crear Primera Zona
            </button>
          </div>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="glass-card p-6 border-2 hover:border-purple-500 transition-all group"
              style={{ borderColor: `${zone.color}40` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${zone.color}30` }}
                  >
                    <MapPin size={24} style={{ color: zone.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{zone.name}</h3>
                    <p className="text-sm text-slate-400">
                      {zone._count.tables} mesas
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Color
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-white/10"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-sm font-mono text-slate-400">
                    {zone.color}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setEditingZone(zone);
                    setModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors font-bold"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-bold"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Zone Modal */}
      <ZoneModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        zone={editingZone}
        onSuccess={loadZones}
      />
    </div>
  );
}
