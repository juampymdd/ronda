"use client";

import React, { useState } from "react";
import { InteractiveFloorPlan } from "@/features/floorplan/components/InteractiveFloorPlan";
import { ShoppingCart, LayoutGrid, ListTodo, Pizza } from "lucide-react";
import { cn } from "@/lib/utils";

// Dummy data for visual representation
const INITIAL_TABLES = [
    { id: "1", number: 1, capacity: 2, status: "LIBRE" as const, x: 50, y: 50, updatedAt: new Date() },
    { id: "2", number: 2, capacity: 4, status: "OCUPADA" as const, x: 200, y: 50, updatedAt: new Date() },
    { id: "3", number: 3, capacity: 2, status: "ESPERANDO" as const, x: 350, y: 50, updatedAt: new Date(Date.now() - 20 * 60 * 1000) },
    { id: "4", number: 4, capacity: 6, status: "LIBRE" as const, x: 50, y: 200, updatedAt: new Date() },
];

export default function MozoDashboard() {
    const [activeTab, setActiveTab] = useState("mapa");

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col xl:flex-row">
            {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) */}
            <nav className="p-6 border-r border-white/5 flex flex-col gap-8 w-full xl:w-24 shrink-0 bg-slate-900 items-center">
                <div className="bg-brand-primary p-3 rounded-2xl shadow-lg shadow-brand-primary/20">
                    <Pizza size={24} className="text-white" />
                </div>

                <div className="flex xl:flex-col gap-6 flex-1 justify-center">
                    <button
                        onClick={() => setActiveTab("mapa")}
                        className={cn("p-4 rounded-xl transition-all", activeTab === "mapa" ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                    >
                        <LayoutGrid size={24} />
                    </button>
                    <button
                        onClick={() => setActiveTab("pedidos")}
                        className={cn("p-4 rounded-xl transition-all", activeTab === "pedidos" ? "bg-white/10 text-brand-primary" : "text-slate-500 hover:text-white")}
                    >
                        <ListTodo size={24} />
                    </button>
                </div>
            </nav>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter">MAPA DE SALÓN</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Sincronización en tiempo real activa</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="glass-card px-6 py-3 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="font-bold text-sm">8 LIBRES</span>
                        </div>
                        <div className="glass-card px-6 py-3 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                            <span className="font-bold text-sm">2 CRÍTICAS</span>
                        </div>
                    </div>
                </header>

                {activeTab === "mapa" ? (
                    <InteractiveFloorPlan
                        tables={INITIAL_TABLES}
                        onTableClick={(t) => console.log("Abriendo mesa", t.number)}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Pedidos view could list active rondas */}
                        <p className="text-slate-500 col-span-full text-center py-20 italic">No hay pedidos pendientes en tu zona.</p>
                    </div>
                )}
            </main>

            {/* Right Sidebar: Quick Actions Bar (Desktop only) */}
            <aside className="w-80 border-l border-white/5 bg-slate-900/50 p-6 hidden xl:block">
                <h2 className="font-black italic text-xl mb-6 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-brand-primary" />
                    QUICK-ADD
                </h2>

                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lo más vendido</p>
                    {["Pinta IPA", "Fernet", "Gintonic", "Nachos"].map((item) => (
                        <button
                            key={item}
                            className="w-full glass-card p-4 text-left font-bold hover:bg-white/10 transition-colors flex justify-between items-center group"
                        >
                            {item}
                            <span className="bg-brand-primary w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                +
                            </span>
                        </button>
                    ))}
                </div>
            </aside>
        </div>
    );
}
