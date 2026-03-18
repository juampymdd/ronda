import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

interface CartStore {
    items: CartItem[];
    tableId: string | null;
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    setTableId: (tableId: string) => void;
    total: number;
}

const calcTotal = (items: CartItem[]) =>
    items.reduce((acc, i) => acc + i.price * i.quantity, 0);

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            items: [],
            total: 0,
            tableId: null,
            setTableId: (tableId) => set({ tableId }),
            addItem: (newItem) =>
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.productId === newItem.productId
                    );
                    let nextItems;
                    if (existing) {
                        nextItems = state.items.map((i) =>
                            i.productId === newItem.productId
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        );
                    } else {
                        nextItems = [...state.items, { ...newItem, quantity: 1 }];
                    }
                    return {
                        items: nextItems,
                        total: calcTotal(nextItems),
                    };
                }),
            removeItem: (productId) =>
                set((state) => {
                    const nextItems = state.items.filter(
                        (i) => i.productId !== productId
                    );
                    return {
                        items: nextItems,
                        total: calcTotal(nextItems),
                    };
                }),
            updateQuantity: (productId, quantity) =>
                set((state) => {
                    const nextItems = state.items
                        .map((i) =>
                            i.productId === productId
                                ? { ...i, quantity: Math.max(0, quantity) }
                                : i
                        )
                        .filter((i) => i.quantity > 0);
                    return {
                        items: nextItems,
                        total: calcTotal(nextItems),
                    };
                }),
            clearCart: () => set({ items: [], total: 0, tableId: null }),
        }),
        {
            name: "ronda-cart",
            storage: createJSONStorage(() => localStorage),
            // Solo persistimos items y tableId, no las funciones
            partialize: (state) => ({
                items: state.items,
                total: state.total,
                tableId: state.tableId,
            }),
        }
    )
);
