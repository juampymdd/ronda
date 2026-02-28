"use client";

import React, { useState, useEffect } from "react";
import { X, Receipt, CreditCard, Printer, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtSnapshot: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  items: OrderItem[];
  createdAt: Date;
}

interface Ronda {
  id: string;
  orders: Order[];
}

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
  rondas?: Ronda[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onSuccess?: () => void;
}

export function CloseTableModal({ isOpen, onClose, table, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [rondaData, setRondaData] = useState<Ronda | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA">(
    "EFECTIVO",
  );

  useEffect(() => {
    if (isOpen && table) {
      loadRondaData();
    }
  }, [isOpen, table]);

  const loadRondaData = async () => {
    if (!table) return;

    try {
      const response = await fetch(`/api/tables/${table.id}/active-ronda`);
      const result = await response.json();

      if (result.success && result.data) {
        setRondaData(result.data);
      }
    } catch (error) {
      console.error("Error loading ronda:", error);
    }
  };

  const calculateTotal = () => {
    if (!rondaData) return 0;

    return rondaData.orders.reduce((total, order) => {
      return (
        total +
        order.items.reduce((orderTotal, item) => {
          return orderTotal + Number(item.priceAtSnapshot) * item.quantity;
        }, 0)
      );
    }, 0);
  };

  const handlePrintTicket = () => {
    // TODO: Implement ticket printing
    console.log("Printing ticket for table", table?.number);
    window.print();
  };

  const handleCloseTable = async () => {
    if (!table || !rondaData) return;

    setLoading(true);
    try {
      // Close the ronda
      const response = await fetch(`/api/rondas/${rondaData.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update table status to LIBRE
        await fetch(`/api/tables/${table.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "LIBRE" }),
        });

        onSuccess?.();
        onClose();
      } else {
        console.error("Error closing table:", result.error);
        alert("Error al cerrar la mesa");
      }
    } catch (error) {
      console.error("Error closing table:", error);
      alert("Error al cerrar la mesa");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !table) return null;

  const total = calculateTotal();
  const itemCount =
    rondaData?.orders.reduce((sum, order) => sum + order.items.length, 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">
                CERRAR MESA {table.number}
              </h2>
              <p className="text-sm text-slate-400">Resumen y cobro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Orders Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Detalle de Consumo
            </h3>

            {!rondaData || rondaData.orders.length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                <p className="text-slate-500">
                  No hay órdenes activas en esta mesa
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rondaData.orders.map((order, orderIndex) => (
                  <div
                    key={order.id}
                    className="bg-slate-800/50 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Orden #{orderIndex + 1}</span>
                      <span>
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex gap-3">
                          <span className="text-slate-400 font-mono">
                            {item.quantity}x
                          </span>
                          <span className="font-medium">
                            {item.product.name}
                          </span>
                        </div>
                        <span className="font-bold">
                          $
                          {(
                            Number(item.priceAtSnapshot) * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border-2 border-purple-500/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-slate-400">Items:</span>
              <span className="text-xl font-black">{itemCount}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-2xl font-black">TOTAL:</span>
              <span className="text-4xl font-black text-purple-400">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Método de Pago
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("EFECTIVO")}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all font-bold",
                  paymentMethod === "EFECTIVO"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
                )}
              >
                💵 Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod("TARJETA")}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all font-bold",
                  paymentMethod === "TARJETA"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
                )}
              >
                💳 Tarjeta
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-slate-900/50 space-y-3">
          <button
            onClick={handlePrintTicket}
            disabled={!rondaData || rondaData.orders.length === 0}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-5 h-5" />
            Imprimir Ticket
          </button>

          <button
            onClick={handleCloseTable}
            disabled={loading || !rondaData || rondaData.orders.length === 0}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-6 h-6" />
            {loading ? "Procesando..." : "COBRAR Y CERRAR MESA"}
          </button>
        </div>
      </div>
    </div>
  );
}
