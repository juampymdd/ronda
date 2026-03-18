"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    ClipboardList,
    CalendarCheck,
    Plus,
    Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStatus, ReservationStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { SkeletonStatCard, SkeletonReservationCard, SkeletonStatsDashboard } from "@/components/skeletons";

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
    openedAt?: Date | string | null;
    tableGroupId?: string | null;
    tableGroup?: TableGroup | null;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchTables(): Promise<Table[]> {
    const res = await fetch("/api/tables");
    if (!res.ok) throw new Error("Error al cargar mesas");
    const json = await res.json();
    return json.data;
}

async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    if (!res.ok) throw new Error("Error al cargar estadísticas");
    const json = await res.json();
    return { stats: json.stats, chartData: json.chartData };
}

async function fetchReservations(date: string, status: string) {
    const params = new URLSearchParams({ date });
    if (status !== "ALL") params.set("status", status);
    const res = await fetch(`/api/reservations?${params}`);
    if (!res.ok) throw new Error("Error al cargar reservas");
    const json = await res.json();
    return json.data;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"mesas" | "stats" | "pedidos" | "reservas">("mesas");
    const [selectedZone, setSelectedZone] = useState("TODAS");
    const [closeTableModal, setCloseTableModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [reservationModal, setReservationModal] = useState(false);
    const [reservationFilters, setReservationFilters] = useState({
        date: new Date().toISOString().split("T")[0],
        status: "ALL",
    });

    // ── Queries ──────────────────────────────────────────────────────────────

    const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ["tables"],
        queryFn: fetchTables,
        staleTime: 15000,
        refetchInterval: 30000, // dashboard no necesita 5s — LiveMonitor ya lo hace
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: fetchStats,
        enabled: activeTab === "stats",
        staleTime: 60000,
        refetchInterval: activeTab === "stats" ? 60000 : false,
    });

    const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
        queryKey: ["reservations", reservationFilters.date, reservationFilters.status],
        queryFn: () => fetchReservations(reservationFilters.date, reservationFilters.status),
        enabled: activeTab === "reservas",
        staleTime: 30000,
    });

    // ── Derived state ────────────────────────────────────────────────────────

    const uniqueZones = Array.from(
        new Map(tables.filter((t) => t.zone).map((t) => [t.zone!.id, t.zone!])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));

    const libreCount = tables.filter((t) => t.status === "LIBRE").length;
    const occupiedCount = tables.filter((t) => t.status !== "LIBRE").length;

    const stats = statsData?.stats;
    const chartData = statsData?.chartData;

    // ── Handlers ─────────────────────────────────────────────────────────────

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

    const handleReservationStatusChange = async (id: string, status: ReservationStatus) => {
        try {
            const res = await fetch(`/api/reservations/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if ((await res.json()).success) {
                queryClient.invalidateQueries({ queryKey: ["reservations"] });
                queryClient.invalidateQueries({ queryKey: ["tables"] });
            }
        } catch (error) {
            console.error("Error updating reservation status:", error);
        }
    };

    const handleSeatCustomer = async (id: string) => {
        try {
            const res = await fetch(`/api/reservations/${id}/seat`, { method: "POST" });
            if ((await res.json()).success) {
                queryClient.invalidateQueries({ queryKey: ["reservations"] });
                queryClient.invalidateQueries({ queryKey: ["tables"] });
            }
        } catch (error) {
            console.error("Error seating customer:", error);
        }
    };

    const handleCloseTableSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["tables"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    };

    const handleReservationSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter">DASHBOARD</h1>
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
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-white/10 w-max sm:w-auto">
                        <button
                            onClick={() => setActiveTab("mesas")}
                            className={cn(
                                "px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === "mesas"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                        >
                            <LayoutGrid size={18} />
                            <span className="text-sm sm:text-base">Mesas</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("reservas")}
                            className={cn(
                                "px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === "reservas"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                        >
                            <CalendarCheck size={18} />
                            <span className="text-sm sm:text-base">Reservas</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("pedidos")}
                            className={cn(
                                "px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === "pedidos"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                        >
                            <ClipboardList size={18} />
                            <span className="text-sm sm:text-base">Pedidos</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={cn(
                                "px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === "stats"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                        >
                            <BarChart3 size={18} />
                            <span className="text-sm sm:text-base">Estadísticas</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "mesas" ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tablesLoading ? (
                            <>
                                <SkeletonStatCard borderColor="border-emerald-500/30" />
                                <SkeletonStatCard borderColor="border-amber-500/30" />
                                <SkeletonStatCard borderColor="border-blue-500/30" />
                                <SkeletonStatCard borderColor="border-purple-500/30" />
                            </>
                        ) : (
                            <>
                                <div className="glass-card p-4 border-2 border-emerald-500/50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mesas Libres</p>
                                    <p className="text-3xl font-black mt-2 text-emerald-400">{libreCount}</p>
                                </div>
                                <div className="glass-card p-4 border-2 border-amber-500/50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mesas Ocupadas</p>
                                    <p className="text-3xl font-black mt-2 text-amber-400">{occupiedCount}</p>
                                </div>
                                <div className="glass-card p-4 border-2 border-blue-500/50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Mesas</p>
                                    <p className="text-3xl font-black mt-2">{tables.length}</p>
                                </div>
                                <div className="glass-card p-4 border-2 border-purple-500/50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zonas</p>
                                    <p className="text-3xl font-black mt-2">{uniqueZones.length}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Zone Filter */}
                    <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest shrink-0">
                                    Zona:
                                </span>
                                <button
                                    onClick={() => setSelectedZone("TODAS")}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
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
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                                            selectedZone === zone.name
                                                ? "text-white"
                                                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                        style={
                                            selectedZone === zone.name
                                                ? { backgroundColor: zone.color, boxShadow: `0 0 20px ${zone.color}40` }
                                                : {}
                                        }
                                    >
                                        {zone.name}
                                    </button>
                                ))}
                            </div>

                            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 shrink-0">
                                <Receipt className="w-4 h-4 text-blue-400" />
                                <span>Click en mesa ocupada para cobrar</span>
                            </div>
                        </div>
                    </div>

                    {/* Floor Plan */}
                    <InteractiveFloorPlan
                        tables={tables}
                        onTableClick={handleTableClick}
                        adminMode={true}
                        selectedZoneFilter={selectedZone}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["tables"] })}
                    />
                </>
            ) : activeTab === "pedidos" ? (
                <OrdersView />
            ) : activeTab === "reservas" ? (
                <>
                    {/* Reservations Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={reservationFilters.date}
                                onChange={(e) =>
                                    setReservationFilters({ ...reservationFilters, date: e.target.value })
                                }
                                className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                            />
                            <select
                                value={reservationFilters.status}
                                onChange={(e) =>
                                    setReservationFilters({ ...reservationFilters, status: e.target.value })
                                }
                                className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
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
                            className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold uppercase tracking-wider bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
                        >
                            <Plus size={18} />
                            Nueva Reserva
                        </button>
                    </div>

                    <TableSearchBar
                        tables={tables}
                        onSelectTable={handleTableSelect}
                        showOnlyAvailable={true}
                    />

                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter mb-4">RESERVAS DEL DÍA</h3>
                        {reservationsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonReservationCard key={i} />
                                ))}
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="glass-card p-12 text-center border border-white/10">
                                <CalendarCheck className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                                <p className="text-slate-400 text-lg">No hay reservas para esta fecha</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reservations.map((reservation: any) => (
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
                    {statsLoading ? (
                        <SkeletonStatsDashboard />
                    ) : stats && chartData ? (
                        <>
                            <DashboardStats stats={stats} />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <SalesChart data={chartData.salesData} />
                                <OrderStatusChart data={chartData.statusData} />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                <div>
                                    <TopTablesChart data={chartData.topTablesData} />
                                </div>
                                <div className="xl:col-span-2">
                                    <LiveMonitor />
                                </div>
                            </div>

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

            {/* Modals */}
            <CloseTableModal
                isOpen={closeTableModal}
                onClose={() => setCloseTableModal(false)}
                table={selectedTable}
                onSuccess={handleCloseTableSuccess}
            />

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
