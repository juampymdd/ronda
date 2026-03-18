"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingCart, Send, ChevronRight, Loader2, WifiOff } from "lucide-react";
import { processOrderAction } from "@/actions/orderActions";
import { cn, formatMoney } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    price: number;
    category: {
        id: string;
        name: string;
    };
}

async function fetchProducts(): Promise<Product[]> {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Error al cargar productos");
    const json = await res.json();
    return json.data as Product[];
}

export default function RondaQRPage() {
    const { tableId } = useParams();
    const { items, addItem, total, clearCart, setTableId } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    // Register tableId in store for cart persistence
    useEffect(() => {
        if (tableId) setTableId(tableId as string);
    }, [tableId, setTableId]);

    // Offline detection
    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        setIsOnline(navigator.onLine);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    const { data: products = [], isLoading, isError } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
        staleTime: 1000 * 60 * 5, // 5 min — productos no cambian seguido
        gcTime: 1000 * 60 * 30,   // 30 min en cache offline
    });

    // Extract unique categories from real products
    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category.name))).sort(),
        [products]
    );

    const [activeCategory, setActiveCategory] = useState<string>("");

    // Set first category once products load
    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0]);
        }
    }, [categories, activeCategory]);

    const filteredProducts = useMemo(
        () => products.filter((p) => p.category.name === activeCategory),
        [products, activeCategory]
    );

    const handleOrder = async () => {
        if (items.length === 0) return;
        setIsSubmitting(true);

        const result = await processOrderAction({
            tableId: tableId as string,
            mozoId: "qr-system",
            items: items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                notes: i.notes,
            })),
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
            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-amber-400 text-sm font-bold">
                    <WifiOff size={16} />
                    Sin conexión — mostrando menú guardado
                </div>
            )}

            {/* Header */}
            <header className="p-6 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <h1 className="text-2xl font-black italic tracking-tighter text-brand-primary">RONDA</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mesa {tableId}</p>
            </header>

            {/* Loading state */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-brand-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest">Cargando menú...</p>
                </div>
            )}

            {/* Error state */}
            {isError && !isLoading && products.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                    <WifiOff size={40} className="mx-auto mb-3 text-amber-400" />
                    <p className="font-bold">No se pudo cargar el menú</p>
                    <p className="text-sm mt-1">Revisá tu conexión e intentá de nuevo</p>
                </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar scroll-smooth">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "shrink-0 px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border",
                                activeCategory === cat
                                    ? "bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/20"
                                    : "bg-slate-900 border-white/5 text-slate-400"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Product List */}
            <div className="p-4 grid gap-4">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="glass-card p-4 flex justify-between items-center group active:scale-[0.98] transition-transform"
                    >
                        <div>
                            <h3 className="font-bold text-lg">{product.name}</h3>
                            <p className="text-brand-secondary font-mono font-bold">
                                {formatMoney(product.price)}
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                addItem({
                                    productId: product.id,
                                    name: product.name,
                                    price: product.price,
                                })
                            }
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
                                <span className="block text-[10px] font-bold uppercase opacity-70">
                                    Total Ronda
                                </span>
                                <span className="block text-xl font-black">{formatMoney(total)}</span>
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
