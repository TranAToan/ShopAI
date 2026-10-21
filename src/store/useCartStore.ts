import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../types/product.schema';

export type CartItem = Product & { quantity: number };

type CartState = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  totalQuantity: () => number;
  totalPrice: () => number;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: product =>
        set(state => {
          const existing = state.items.find(item => item.id === product.id);
          return existing
            ? {
                items: state.items.map(item =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                ),
              }
            : { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: productId =>
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        })),
      totalQuantity: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'shopai-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ items: state.items }),
    },
  ),
);