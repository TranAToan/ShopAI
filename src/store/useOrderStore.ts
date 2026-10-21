import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from './useCartStore';

export type PaymentStatus = 'PENDING' | 'PAID';
export type OrderRecord = {
  id: string;
  items: CartItem[];
  total: number;
  status: PaymentStatus;
  createdAt: string;
};

type OrderState = {
  orders: OrderRecord[];
  addOrder: (order: OrderRecord) => void;
  markPaid: (orderId: string) => void;
  getById: (orderId: string) => OrderRecord | undefined;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: order => set(state => ({ orders: [order, ...state.orders] })),
      markPaid: orderId =>
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, status: 'PAID' } : order,
          ),
        })),
      getById: orderId => get().orders.find(order => order.id === orderId),
    }),
    { name: 'shopai-orders', storage: createJSONStorage(() => AsyncStorage) },
  ),
);