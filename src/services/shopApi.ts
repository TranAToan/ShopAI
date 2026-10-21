import axios from 'axios';
import { z } from 'zod';
import axiosClient from '@api/axiosClient';
import type { CartItem } from '@store/useCartStore';
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});
const AuthSchema = z.object({
  accessToken: z.string().min(10),
  user: UserSchema,
});
export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  total: z.number().int().nonnegative(),
  status: z.enum(['PENDING', 'PAID']),
  createdAt: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().int().positive(),
    }),
  ),
});
export type ApiOrder = z.infer<typeof OrderSchema>;
export async function authenticate(
  email: string,
  password: string,
  name?: string,
) {
  const route = name === undefined ? 'login' : 'register';
  const res = await axiosClient.post(`/api/auth/${route}`, {
    email: email.trim().toLowerCase(),
    password,
    ...(name !== undefined ? { name: name.trim() } : {}),
  });
  return AuthSchema.parse(res.data);
}
export async function placeOrder(
  items: CartItem[],
  total: number,
  key: string,
  signal?: AbortSignal,
) {
  const res = await axiosClient.post(
    '/api/orders',
    {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      total,
    },
    { headers: { 'Idempotency-Key': key }, signal },
  );
  return OrderSchema.parse(res.data);
}
export async function fetchOrders(signal?: AbortSignal) {
  return z
    .array(OrderSchema)
    .parse((await axiosClient.get('/api/orders', { signal })).data);
}
export async function fetchOrder(id: string, signal?: AbortSignal) {
  return OrderSchema.parse(
    (await axiosClient.get(`/api/orders/${encodeURIComponent(id)}`, { signal }))
      .data,
  );
}
export async function payOrder(id: string) {
  return OrderSchema.parse(
    (await axiosClient.post(`/api/orders/${encodeURIComponent(id)}/pay`)).data,
  );
}
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every(m => typeof m === 'string'))
      return message.join(', ');
    if (!error.response)
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
    return 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.';
  }
  return 'Dữ liệu chưa hợp lệ hoặc có lỗi tạm thời. Vui lòng thử lại.';
}
