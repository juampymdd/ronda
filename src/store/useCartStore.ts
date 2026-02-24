import { create } from "zustand";

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
}

export const useCartStore = create<CartStore>((set) => ({
    items: [],
    total: 0,
    addItem: (newItem) =>
        set((state) => {
            const existing = state.items.find((i) => i.productId === newItem.productId);
            let nextItems;
            if (existing) {
                nextItems = state.items.map((i) =>
                    i.productId === newItem.productId ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                nextItems = [...state.items, { ...newItem, quantity: 1 }];
            }
            return {
                items: nextItems,
                total: nextItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
            };
        }),
    removeItem: (productId) =>
        set((state) => {
            const nextItems = state.items.filter((i) => i.productId !== productId);
            return {
                items: nextItems,
                total: nextItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
            };
        }),
    updateQuantity: (productId, quantity) =>
        set((state) => {
            const nextItems = state.items.map((i) =>
                i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i
            ).filter(i => i.quantity > 0);
            return {
                items: nextItems,
                total: nextItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
            };
        }),
    clearCart: () => set({ items: [], total: 0 }),
}));
