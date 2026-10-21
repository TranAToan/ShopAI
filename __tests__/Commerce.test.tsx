import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import CheckoutScreen from '../src/screens/CheckoutScreen';
import { useCartStore } from '../src/store/useCartStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { placeOrder } from '../src/services/shopApi';
jest.mock('../src/services/shopApi', () => ({
  placeOrder: jest.fn(),
  apiError: () => 'Mất kết nối',
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
const product = {
  id: 'backend_prod_0',
  name: 'Test',
  price: 1000000,
  image: 'https://example.com/test.jpg',
  quantity: 1,
};
let renderer: TestRenderer.ReactTestRenderer;
let client: QueryClient;
beforeEach(async () => {
  jest.clearAllMocks();
  useCartStore.setState({ items: [product] });
  useAuthStore.setState({ token: 'test', sessionId: 100, isUnlocked: true });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  await act(async () => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <CheckoutScreen />
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  client.clear();
});
const confirm = () =>
  renderer.root
    .findAll(node => node.props.title === 'Xác nhận đặt hàng')[0]
    .props.onPress();
test('double tap sends one order; successful order clears cart and refreshes only current session', async () => {
  let complete!: (value: unknown) => void;
  jest.mocked(placeOrder).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve as never;
      }),
  );
  const invalidation = jest.spyOn(client, 'invalidateQueries');
  await act(async () => {
    confirm();
    confirm();
  });
  expect(placeOrder).toHaveBeenCalledTimes(1);
  await act(async () => {
    complete({ id: 'ORD-test' });
    await new Promise<void>(r => setTimeout(r, 15));
  });
  expect(useCartStore.getState().items).toEqual([]);
  expect(invalidation).toHaveBeenCalledWith({ queryKey: ['orders', 100] });
});
test('network failure preserves cart and retry reuses the same idempotency key', async () => {
  jest.mocked(placeOrder).mockRejectedValue(new Error('offline'));
  await act(async () => {
    confirm();
    await new Promise<void>(r => setTimeout(r, 15));
  });
  expect(useCartStore.getState().items).toHaveLength(1);
  await act(async () => {
    confirm();
    await new Promise<void>(r => setTimeout(r, 15));
  });
  expect(placeOrder).toHaveBeenCalledTimes(2);
  expect(jest.mocked(placeOrder).mock.calls[0][2]).toBe(
    jest.mocked(placeOrder).mock.calls[1][2],
  );
});
test('response after logout does not clear another session cart', async () => {
  let complete!: (value: unknown) => void;
  jest.mocked(placeOrder).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve as never;
      }),
  );
  await act(async () => {
    confirm();
  });
  await act(async () => {
    useAuthStore.setState({ token: null, sessionId: 101, isUnlocked: false });
    complete({ id: 'ORD-old' });
    await new Promise<void>(r => setTimeout(r, 15));
  });
  expect(useCartStore.getState().items).toHaveLength(1);
});
