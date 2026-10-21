import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductSchema } from '../src/types/product.schema';
import { useCartStore } from '../src/store/useCartStore';
import { useOrderStore } from '../src/store/useOrderStore';
import { useAuthStore } from '../src/store/useAuthStore';

const product = {
  id: 'p1',
  name: 'Tai nghe',
  price: 250000,
  image: 'https://example.com/product.png',
};
test('the original product schema still validates/rejects inputs with Zod 3.25', () => {
  expect(ProductSchema.parse(product)).toEqual(product);
  expect(ProductSchema.safeParse({ ...product, price: -1 }).success).toBe(
    false,
  );
  expect(
    ProductSchema.safeParse({ ...product, image: 'invalid' }).success,
  ).toBe(false);
});
test('logout leaves the existing cart/order persistence intact and does not persist auth token', async () => {
  await useCartStore.persist.rehydrate();
  await useOrderStore.persist.rehydrate();
  useCartStore.getState().clearCart();
  useCartStore.getState().addItem(product);
  useCartStore.getState().addItem(product);
  expect(useCartStore.getState().totalQuantity()).toBe(2);
  expect(useCartStore.getState().totalPrice()).toBe(500000);
  useOrderStore.getState().addOrder({
    id: 'o1',
    items: useCartStore.getState().items,
    total: 500000,
    status: 'PENDING',
    createdAt: '2026-10-09T00:00:00+07:00',
  });
  await useAuthStore.getState().login('test-session');
  await useAuthStore.getState().logout();
  expect(useCartStore.getState().totalQuantity()).toBe(2);
  expect(useOrderStore.getState().getById('o1')?.status).toBe('PENDING');
  const cart = await AsyncStorage.getItem('shopai-cart-storage');
  expect(cart).toContain('Tai nghe');
  expect(cart).not.toContain('test-session');
  useCartStore.setState({ items: [] });
  // Restore the saved fixture through the same public persist mechanism.
  expect(cart).not.toBeNull();
  await AsyncStorage.setItem('shopai-cart-storage', cart ?? '');
  await useCartStore.persist.rehydrate();
  expect(useCartStore.getState().totalQuantity()).toBe(2);
});
