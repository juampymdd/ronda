"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingCart, Send, ChevronRight } from "lucide-react";
import { processOrderAction } from "@/actions/orderActions";
import { cn } from "@/lib/utils";

// Mock products for the demonstration (in a real app, these would come from a server component or API)
const CATEGORIES = ["Cervezas", "Tragos", "Tapeo", "Platos"];

export default function RondaQRPage() {
    const { tableId } = useParams();
    const { items, addItem, total, clearCart } = useCartStore();
    const [activeCategory, setActiveCategory] = useState("Cervezas");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // In a real implementation, we'd fetch this from the DB
    const products = [
        { id: "p1", name: "IPA - Pinta", price: 4500, category: "Cervezas" },
        { id: "p2", name: "Honey - Pinta", price: 4200, category: "Cervezas" },
        { id: "p3", name: "Gin Tonic", price: 4000, category: "Tragos" },
        { id: "p4", name: "Papas Cheddar", price: 5500, category: "Tapeo" },
    ];

    const handleOrder = async () => {
        if (items.length === 0) return;
        setIsSubmitting(true);

        // We use a fixed "Self-Service" User ID for QR orders in this demo
        const result = await processOrderAction({
            tableId: tableId as string,
            mozoId: "qr-system",
            items: items.map(i => ({ productId: i.productId, quantity: i.quantity, notes: i.notes }))
        });

        if (result.success) {
            alert("¡Pedido enviado! Preparando tu ronda...");
            clearCart();
        } else {
            alert("Error: " + result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            {/* Header */}
            <header className="p-6 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <h1 className="text-2xl font-black italic tracking-tighter text-brand-primary">RONDA</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mesa {tableId}</p>
            </header>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border",
                            activeCategory === cat
                                ? "bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/20"
                                : "bg-slate-900 border-white/5 text-slate-400"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product List */}
            <div className="p-4 grid gap-4">
                {products.filter(p => p.category === activeCategory).map(product => (
                    <div key={product.id} className="glass-card p-4 flex justify-between items-center group active:scale-[0.98] transition-transform">
                        <div>
                            <h3 className="font-bold text-lg">{product.name}</h3>
                            <p className="text-brand-secondary font-mono font-bold">${product.price}</p>
                        </div>
                        <button
                            onClick={() => addItem({ productId: product.id, name: product.name, price: product.price })}
                            className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 group-active:bg-brand-primary transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Floating Action Bar */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-6 right-6 z-50">
                    <button
                        onClick={handleOrder}
                        disabled={isSubmitting}
                        className="w-full bg-brand-primary h-16 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-brand-primary/40 animate-in slide-in-from-bottom duration-500"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <ShoppingCart size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block text-[10px] font-bold uppercase opacity-70">Total Ronda</span>
                                <span className="block text-xl font-black">${total}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-black italic text-lg tracking-tighter">
                            {isSubmitting ? "ENVIANDO..." : "PEDIR AHORA"}
                            <Send size={20} />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
