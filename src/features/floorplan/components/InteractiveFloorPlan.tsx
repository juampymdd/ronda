"use client";

import React from "react";
import { TableStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Users, Clock } from "lucide-react";

interface Table {
    id: string;
    number: number;
    capacity: number;
    status: TableStatus;
    x: number;
    y: number;
    updatedAt: Date;
}

interface Props {
    tables: Table[];
    onTableClick: (table: Table) => void;
}

const statusColors: Record<TableStatus, string> = {
    LIBRE: "bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20",
    OCUPADA: "bg-amber-500/10 border-amber-500 text-amber-500 hover:bg-amber-500/20",
    PIDIENDO: "bg-sky-500/10 border-sky-500 text-sky-500 hover:bg-sky-500/20",
    ESPERANDO: "bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500/20 animate-pulse",
    PAGANDO: "bg-violet-500/10 border-violet-500 text-violet-500 hover:bg-violet-500/20",
};

export function InteractiveFloorPlan({ tables, onTableClick }: Props) {
    return (
        <div className="relative w-full h-[600px] bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-8">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {tables.map((table) => {
                const isWaitingTooLong = table.status === "ESPERANDO" &&
                    (new Date().getTime() - new Date(table.updatedAt).getTime()) > 15 * 60 * 1000;

                return (
                    <button
                        key={table.id}
                        onClick={() => onTableClick(table)}
                        style={{ left: `${table.x}px`, top: `${table.y}px` }}
                        className={cn(
                            "absolute w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group shadow-lg backdrop-blur-sm",
                            statusColors[table.status],
                            isWaitingTooLong && "border-red-600 bg-red-600/20 ring-4 ring-red-600/30"
                        )}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Mesa</span>
                        <span className="text-3xl font-black mb-1">{table.number}</span>
                        <div className="flex items-center gap-1 opacity-80">
                            <Users size={12} />
                            <span className="text-[10px] font-bold">{table.capacity}</span>
                        </div>

                        {isWaitingTooLong && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg animate-bounce">
                                <Clock size={14} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
