"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  User,
  Utensils,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  XCircle,
  Moon,
} from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { cn, formatMoney } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtSnapshot: number;
  product: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    } | null;
  };
}

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  mozo: {
    id: string;
    name: string;
  } | null;
  ronda: {
    id: string;
    table: {
      id: string;
      number: number;
      zone: {
        name: string;
        color: string;
      } | null;
    };
  };
  items: OrderItem[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationMeta;
}

const statusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    icon: AlertCircle,
  },
  PREPARANDO: {
    label: "Preparando",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    icon: ChefHat,
  },
  LISTO: {
    label: "Listo",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/50",
    icon: CheckCircle2,
  },
  ENTREGADO: {
    label: "Entregado",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
    border: "border-slate-500/50",
    icon: CheckCircle2,
  },
  INCOMPLETO: {
    label: "Incompleto",
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    border: "border-rose-500/50",
    icon: XCircle,
  },
};

async function fetchOrders(
  page: number,
  pageSize: number,
  filterStatus: OrderStatus | "TODOS",
  dateFrom: string,
  dateTo: string,
): Promise<OrdersResponse> {
  const statusParam = filterStatus !== "TODOS" ? `&status=${filterStatus}` : "";
  const dateFromParam = dateFrom ? `&dateFrom=${dateFrom}` : "";
  const dateToParam = dateTo ? `&dateTo=${dateTo}` : "";
  const res = await fetch(
    `/api/orders?page=${page}&limit=${pageSize}${statusParam}${dateFromParam}${dateToParam}`,
  );
  if (!res.ok) throw new Error("Error al cargar pedidos");
  const result = await res.json();
  return { orders: result.data, pagination: result.pagination };
}

export function OrdersView() {
  const today = new Date().toISOString().split("T")[0];
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "TODOS">(
    "TODOS",
  );
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [closingStale, setClosingStale] = useState(false);
  const [staleResult, setStaleResult] = useState<{
    updated: number;
    error?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", currentPage, pageSize, filterStatus, dateFrom, dateTo],
    queryFn: () =>
      fetchOrders(currentPage, pageSize, filterStatus, dateFrom, dateTo),
    refetchInterval: 10000,
    staleTime: 9000,
    placeholderData: (prev) => prev, // keep old data while fetching new page
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  const getOrderTotal = (items: OrderItem[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.priceAtSnapshot, 0);

  const clearDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const setTodayFilter = () => {
    setDateFrom(today);
    setDateTo(today);
    setCurrentPage(1);
  };

  const handleCloseDia = async () => {
    setClosingStale(true);
    setStaleResult(null);
    try {
      const res = await fetch("/api/orders/close-stale", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStaleResult({ updated: data.updated });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        setStaleResult({
          updated: 0,
          error: data.error ?? "Error desconocido",
        });
      }
    } catch (err) {
      console.error("Error cerrando pedidos del día:", err);
      setStaleResult({
        updated: 0,
        error: "No se pudo conectar con el servidor",
      });
    } finally {
      setClosingStale(false);
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            <span className="text-sm font-bold text-white">
              Filtrar por fecha:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {dateFrom || dateTo ? (
            <button
              onClick={clearDateFilters}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <X size={14} />
              Limpiar
            </button>
          ) : (
            <button
              onClick={setTodayFilter}
              className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Calendar size={14} />
              Hoy
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {staleResult && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  staleResult.error ? "text-rose-400" : "text-emerald-400",
                )}
              >
                {staleResult.error
                  ? `Error: ${staleResult.error}`
                  : staleResult.updated === 0
                    ? "No había pedidos pendientes"
                    : `${staleResult.updated} pedido(s) cerrado(s)`}
              </span>
            )}
            <button
              onClick={handleCloseDia}
              disabled={closingStale}
              className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Marca como INCOMPLETO todos los pedidos PENDIENTE/PREPARANDO de días anteriores"
            >
              <Moon size={14} />
              {closingStale ? "Cerrando..." : "Cerrar día anterior"}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setFilterStatus("TODOS");
            setCurrentPage(1);
          }}
          className={cn(
            "px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all",
            filterStatus === "TODOS"
              ? "bg-purple-600 text-white shadow-lg"
              : "bg-slate-800/50 text-slate-400 hover:text-white border border-white/10",
          )}
        >
          Todos ({pagination.total})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status as OrderStatus);
                setCurrentPage(1);
              }}
              className={cn(
                "px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all flex items-center gap-2",
                filterStatus === status
                  ? `${config.bg} ${config.color} ${config.border} border-2 shadow-lg`
                  : "bg-slate-800/50 text-slate-400 hover:text-white border border-white/10",
              )}
            >
              <Icon size={16} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Utensils className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">
            No hay pedidos{" "}
            {filterStatus !== "TODOS" &&
              `en estado ${statusConfig[filterStatus as OrderStatus]?.label.toLowerCase() ?? filterStatus.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            const total = getOrderTotal(order.items);

            return (
              <div
                key={order.id}
                className={cn(
                  "glass-card p-5 border-2 transition-all hover:scale-[1.02]",
                  config.border,
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
                      style={{
                        backgroundColor:
                          order.ronda.table.zone?.color || "#6b7280",
                      }}
                    >
                      {order.ronda.table.number}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {order.ronda.table.zone?.name || "Sin zona"}
                      </p>
                      <p className="text-sm font-bold text-white">
                        Mesa {order.ronda.table.number}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-lg flex items-center gap-1.5",
                      config.bg,
                    )}
                  >
                    <Icon size={14} className={config.color} />
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        config.color,
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Mozo */}
                <div className="flex items-center gap-2 mb-3 text-slate-300">
                  <User size={14} />
                  <span className="text-sm">{order.mozo?.name ?? "QR"}</span>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1">
                        <span className="text-white font-medium">
                          {item.quantity}x
                        </span>{" "}
                        <span className="text-slate-300">
                          {item.product.name}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          {item.product.category?.name}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-xs">
                        $
                        {(
                          item.quantity * item.priceAtSnapshot
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock size={12} />
                    <span>
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                      Total
                    </p>
                    <p className="text-lg font-black text-purple-400">
                      {formatMoney(total)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between glass-card p-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Mostrando{" "}
              <span className="font-bold text-white">
                {(currentPage - 1) * pagination.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * pagination.limit, pagination.total)}
              </span>{" "}
              de{" "}
              <span className="font-bold text-white">{pagination.total}</span>{" "}
              pedidos
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Por página:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center gap-2",
                pagination.hasPrev
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed",
              )}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-3 py-2 text-slate-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "min-w-[40px] px-3 py-2 rounded-lg font-bold text-sm transition-all",
                          currentPage === page
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50",
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(pagination.totalPages, prev + 1),
                )
              }
              disabled={!pagination.hasNext}
              className={cn(
                "p-2 rounded-lg transition-all flex items-center gap-2",
                pagination.hasNext
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed",
              )}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
