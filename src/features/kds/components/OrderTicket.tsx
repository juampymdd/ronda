"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface OrderItem {
    id: string;
    product: {
        name: string;
    };
    quantity: number;
    notes?: string | null;
}

interface Order {
    id: string;
    status: string;
    createdAt: Date;
    items: OrderItem[];
}

interface Props {
    order: Order;
    onComplete: (id: string) => void;
    slaMinutes?: number;
}

export function OrderTicket({ order, onComplete, slaMinutes = 10 }: Props) {
    const [timeAgo, setTimeAgo] = useState("");
    const [isDelayed, setIsDelayed] = useState(false);

    useEffect(() => {
        const update = () => {
            const elapsed = (new Date().getTime() - new Date(order.createdAt).getTime()) / 1000 / 60;
            setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es }));
            setIsDelayed(elapsed > slaMinutes);
        };

        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [order.createdAt, slaMinutes]);

    return (
        <div className={cn(
            "w-full max-w-sm rounded-2xl border-2 transition-all duration-500 overflow-hidden shadow-xl",
            isDelayed
                ? "bg-rose-950/40 border-rose-500 shadow-rose-500/20 animate-pulse"
                : "bg-slate-900 border-slate-700 shadow-black/40"
        )}>
            <div className={cn(
                "p-4 flex justify-between items-center border-b",
                isDelayed ? "border-rose-500/30 bg-rose-500/10" : "border-slate-700 bg-slate-800/50"
            )}>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">#{order.id.slice(-4).toUpperCase()}</span>
                    {isDelayed && <AlertTriangle size={16} className="text-rose-500" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Clock size={14} className={cn(isDelayed && "text-rose-500")} />
                    {timeAgo}
                </div>
            </div>

            <div className="p-4 space-y-3">
                {order.items.map((item) => (
                    <div key={item.id} className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <span className="text-lg font-bold text-white group">
                                <span className="text-sky-400 mr-2">{item.quantity}x</span>
                                {item.product.name}
                            </span>
                        </div>
                        {item.notes && (
                            <p className="text-xs italic text-amber-400 mt-1 pl-6 border-l-2 border-amber-500/30">
                                "{item.notes}"
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onComplete(order.id)}
                className={cn(
                    "w-full p-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-95",
                    isDelayed
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
            >
                <CheckCircle2 size={18} />
                MARCAR COMO LISTO
            </button>
        </div>
    );
}
