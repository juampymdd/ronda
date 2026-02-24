"use client";

import React, { useState } from "react";
import { OrderTicket } from "@/features/kds/components/OrderTicket";
import { Coffee, Pizza, Filter, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy data for KDS
const INITIAL_ORDERS = [
    {
        id: "ord-1234",
        status: "PENDIENTE",
        createdAt: new Date(Date.now() - 12 * 60 * 1000), // Delayed
        items: [
            { id: "itm-1", product: { name: "Burger XL" }, quantity: 2, notes: "Sin cebolla" },
            { id: "itm-2", product: { name: "Papas Cheddar" }, quantity: 1 },
        ],
    },
    {
        id: "ord-5678",
        status: "PENDIENTE",
        createdAt: new Date(Date.now() - 4 * 60 * 1000),
        items: [
            { id: "itm-3", product: { name: "IPA - Pinta" }, quantity: 3 },
        ],
    },
];

export default function KDSPage() {
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [filter, setFilter] = useState("TODOS");

    const completeOrder = (id: string) => {
        setOrders(prev => prev.filter(o => o.id !== id));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* KDS Header */}
            <header className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-accent p-3 rounded-2xl">
                        <Pizza size={24} className="text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter">COCINA & BARRA</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kitchen Display System (KDS)</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setFilter("TODOS")}
                        className={cn("px-6 py-2 rounded-xl font-bold flex items-center gap-2 border transition-all",
                            filter === "TODOS" ? "bg-white text-black border-white" : "bg-slate-800 border-white/10 text-slate-400")}
                    >
                        <Filter size={18} /> TODOS
                    </button>
                    <button className="bg-slate-800 border-white/10 border p-2 rounded-xl text-brand-accent">
                        <AlertCircle size={24} />
                    </button>
                </div>
            </header>

            {/* Kanban Board */}
            <main className="flex-1 p-8 overflow-x-auto">
                <div className="flex gap-8 h-full min-w-max">
                    {/* Station: COCINA */}
                    <section className="w-96 flex flex-col gap-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-lg font-black italic flex items-center gap-2">
                                <Pizza size={20} className="text-brand-accent" /> COCINA
                            </h2>
                            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
                                {orders.length} TICKETS
                            </span>
                        </div>

                        <div className="space-y-6">
                            {orders.map(order => (
                                <OrderTicket
                                    key={order.id}
                                    order={order}
                                    onComplete={completeOrder}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Station: BARRA */}
                    <section className="w-96 flex flex-col gap-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-lg font-black italic flex items-center gap-2">
                                <Coffee size={20} className="text-brand-primary" /> BARRA
                            </h2>
                            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold font-mono">
                                0 TICKETS
                            </span>
                        </div>
                        {/* Empty state example */}
                        <div className="h-40 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-600 font-bold italic">
                            BARRA DESPEJADA
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
