"use client";

import React, { useState, useEffect } from "react";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { CloseTableModal } from "@/features/floorplan/components/CloseTableModal";
import { DashboardStats } from "@/features/admin/components/DashboardStats";
import { RecentActivity } from "@/features/admin/components/RecentActivity";
import { LiveMonitor } from "@/features/admin/components/LiveMonitor";
import { SalesChart } from "@/features/admin/components/SalesChart";
import { OrderStatusChart } from "@/features/admin/components/OrderStatusChart";
import { TopTablesChart } from "@/features/admin/components/TopTablesChart";
import { OrdersView } from "@/features/admin/components/OrdersView";
import { TableSearchBar } from "@/components/TableSearchBar";
import { ReservationModal } from "@/components/ReservationModal";
import { ReservationCard } from "@/components/ReservationCard";
import {
  LayoutGrid,
  BarChart3,
  Receipt,
  ClipboardList,
  CalendarCheck,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStatus, ReservationStatus } from "@prisma/client";
import { useSession } from "next-auth/react";

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

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "mesas" | "stats" | "pedidos" | "reservas"
  >("mesas");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedZone, setSelectedZone] = useState("TODAS");
  const [closeTableModal, setCloseTableModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [reservationModal, setReservationModal] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationFilters, setReservationFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "ALL",
  });

  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);

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

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
        setChartData(result.chartData);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadReservations = async () => {
    try {
      const params = new URLSearchParams({
        date: reservationFilters.date,
        ...(reservationFilters.status !== "ALL" && {
          status: reservationFilters.status,
        }),
      });
      const response = await fetch(`/api/reservations?${params}`);
      const result = await response.json();
      if (result.success) {
        setReservations(result.data);
      }
    } catch (error) {
      console.error("Error loading reservations:", error);
    }
  };

  useEffect(() => {
    loadTables();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "reservas") {
      loadReservations();
    }
  }, [activeTab, reservationFilters]);

  const handleTableClick = (table: Table) => {
    if (table.status !== "LIBRE") {
      setSelectedTable(table);
      setCloseTableModal(true);
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setReservationModal(true);
  };

  const handleReservationStatusChange = async (
    id: string,
    status: ReservationStatus,
  ) => {
    try {
      const response = await fetch(`/api/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) {
        loadReservations();
        loadTables();
      }
    } catch (error) {
      console.error("Error updating reservation status:", error);
    }
  };

  const handleSeatCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}/seat`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        loadReservations();
        loadTables();
      }
    } catch (error) {
      console.error("Error seating customer:", error);
    }
  };

  const handleCloseTableSuccess = () => {
    loadTables();
    loadStats();
  };

  const handleReservationSuccess = () => {
    loadReservations();
    loadTables();
  };

  const uniqueZones = Array.from(
    new Map(
      tables.filter((t) => t.zone).map((t) => [t.zone!.id, t.zone!]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const libreCount = tables.filter((t) => t.status === "LIBRE").length;
  const occupiedCount = tables.filter((t) => t.status !== "LIBRE").length;

  return (
    <div className="p-8 space-y-8">
      {/* Header with Tabs */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            DASHBOARD
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            {activeTab === "mesas"
              ? "Gestión de mesas y cobros"
              : activeTab === "stats"
                ? "Estadísticas y reportes"
                : activeTab === "pedidos"
                  ? "Pedidos globales"
                  : "Reservas y disponibilidad"}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("mesas")}
            className={cn(
              "px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === "mesas"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <LayoutGrid size={20} />
            Mesas
          </button>
          <button
            onClick={() => setActiveTab("reservas")}
            className={cn(
              "px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === "reservas"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <CalendarCheck size={20} />
            Reservas
          </button>
          <button
            onClick={() => setActiveTab("pedidos")}
            className={cn(
              "px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === "pedidos"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <ClipboardList size={20} />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={cn(
              "px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === "stats"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <BarChart3 size={20} />
            Estadísticas
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "mesas" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 border-2 border-emerald-500/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mesas Libres
              </p>
              <p className="text-3xl font-black mt-2 text-emerald-400">
                {libreCount}
              </p>
            </div>
            <div className="glass-card p-4 border-2 border-amber-500/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mesas Ocupadas
              </p>
              <p className="text-3xl font-black mt-2 text-amber-400">
                {occupiedCount}
              </p>
            </div>
            <div className="glass-card p-4 border-2 border-blue-500/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Mesas
              </p>
              <p className="text-3xl font-black mt-2">{tables.length}</p>
            </div>
            <div className="glass-card p-4 border-2 border-purple-500/50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Zonas
              </p>
              <p className="text-3xl font-black mt-2">{uniqueZones.length}</p>
            </div>
          </div>

          {/* Zone Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Filtrar Zona:
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedZone("TODAS")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                      selectedZone === "TODAS"
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Todas
                  </button>
                  {uniqueZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                        selectedZone === zone.name
                          ? "text-white"
                          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                      }`}
                      style={
                        selectedZone === zone.name
                          ? {
                              backgroundColor: zone.color,
                              boxShadow: `0 0 20px ${zone.color}40`,
                            }
                          : {}
                      }
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Help */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>Click en mesa ocupada para cobrar</span>
              </div>
            </div>
          </div>

          {/* Floor Plan */}
          <InteractiveFloorPlan
            tables={tables}
            onTableClick={handleTableClick}
            adminMode={false}
            selectedZoneFilter={selectedZone}
          />
        </>
      ) : activeTab === "pedidos" ? (
        <OrdersView />
      ) : activeTab === "reservas" ? (
        <>
          {/* Reservations Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Date Filter */}
              <input
                type="date"
                value={reservationFilters.date}
                onChange={(e) =>
                  setReservationFilters({
                    ...reservationFilters,
                    date: e.target.value,
                  })
                }
                className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {/* Status Filter */}
              <select
                value={reservationFilters.status}
                onChange={(e) =>
                  setReservationFilters({
                    ...reservationFilters,
                    status: e.target.value,
                  })
                }
                className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="SEATED">Sentadas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSelectedTable(null);
                setReservationModal(true);
              }}
              className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Reserva
            </button>
          </div>

          {/* Table Searcher */}
          <TableSearchBar
            tables={tables}
            onSelectTable={handleTableSelect}
            showOnlyAvailable={true}
          />

          {/* Reservations List */}
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter mb-4">
              RESERVAS DEL DÍA
            </h3>
            {reservations.length === 0 ? (
              <div className="glass-card p-12 text-center border border-white/10">
                <CalendarCheck className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg">
                  No hay reservas para esta fecha
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onStatusChange={handleReservationStatusChange}
                    onSeat={handleSeatCustomer}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Stats Dashboard */}
          {stats && chartData ? (
            <>
              {/* Stats Cards */}
              <DashboardStats stats={stats} />

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SalesChart data={chartData.salesData} />
                <OrderStatusChart data={chartData.statusData} />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Top Tables */}
                <div>
                  <TopTablesChart data={chartData.topTablesData} />
                </div>

                {/* Live Monitor */}
                <div className="xl:col-span-2">
                  <LiveMonitor />
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <RecentActivity orders={stats.recentOrders} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}
        </>
      )}

      {/* Close Table Modal */}
      <CloseTableModal
        isOpen={closeTableModal}
        onClose={() => setCloseTableModal(false)}
        table={selectedTable}
        onSuccess={handleCloseTableSuccess}
      />

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={reservationModal}
        onClose={() => {
          setReservationModal(false);
          setSelectedTable(null);
        }}
        selectedTable={selectedTable}
        userId={session?.user?.id || ""}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
}
