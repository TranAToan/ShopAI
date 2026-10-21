import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopButton from '@components/ShopButton';
import Typography from '@components/ui/Typography';
import { SIZES } from '@constants/theme';
import { useTheme, type ThemeColors } from '@contexts/ThemeContext';
import { useCartStore } from '@store/useCartStore';
import { useAuthStore } from '@store/useAuthStore';
import { placeOrder, apiError } from '@services/shopApi';
import { breadcrumb, reportFailure } from '@services/telemetry';

export default function CheckoutScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const items = useCartStore(state => state.items);
  const totalPrice = useCartStore(state => state.totalPrice());
  const clearCart = useCartStore(state => state.clearCart);
  const sessionId = useAuthStore(state => state.sessionId);
  const busy = useRef(false);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  const mutation = useMutation({
    mutationFn: async () => {
      breadcrumb('Checkout started', {
        screen: 'CheckoutScreen',
        cart_item_count: String(items.length),
      });
      const fingerprint = JSON.stringify({ items, totalPrice, sessionId });
      if (request.current?.fingerprint !== fingerprint) {
        request.current = {
          fingerprint,
          key: `mobile_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        };
      }
      controller.current = new AbortController();
      return placeOrder(
        items,
        totalPrice,
        request.current.key,
        controller.current.signal,
      );
    },
    onSuccess: () => {
      breadcrumb('Checkout succeeded');
      if (
        useAuthStore.getState().sessionId !== sessionId ||
        controller.current?.signal.aborted
      )
        return;
      if (
        JSON.stringify(useCartStore.getState().items) === JSON.stringify(items)
      )
        clearCart();
      void queryClient.invalidateQueries({ queryKey: ['orders', sessionId] });
    },
    onError: () => {
      reportFailure('CheckoutOrderFailed');
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Typography variant="h1" color={colors.text}>
          Xác nhận đơn hàng
        </Typography>
        <Typography variant="body1" color={colors.textLight} style={styles.row}>
          {items.length} sản phẩm
        </Typography>
        <Typography variant="h2" color={colors.primary} style={styles.row}>
          Tổng: {new Intl.NumberFormat('vi-VN').format(totalPrice)} đ
        </Typography>
        {mutation.isError && (
          <Typography variant="body2" color={colors.error} style={styles.row}>
            {apiError(mutation.error)}
          </Typography>
        )}
        {mutation.isSuccess ? (
          <View style={styles.success}>
            <Typography variant="h2" color={colors.success}>
              Đặt hàng thành công
            </Typography>
            <Typography variant="body2" color={colors.textLight}>
              {mutation.data.id} — PENDING
            </Typography>
            <ShopButton
              title="Xem đơn hàng"
              onPress={() =>
                navigation.navigate('OrderDetail', {
                  orderId: mutation.data.id,
                })
              }
              style={styles.button}
            />
          </View>
        ) : (
          <ShopButton
            title="Xác nhận đặt hàng"
            onPress={() => {
              if (busy.current) return;
              busy.current = true;
              mutation.mutate(undefined, {
                onSettled: () => {
                  busy.current = false;
                },
              });
            }}
            isLoading={mutation.isPending}
            disabled={items.length === 0}
            style={styles.button}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: SIZES.padding },
    row: { marginTop: 20 },
    button: { marginTop: 32 },
    success: { alignItems: 'center', marginTop: 40 },
  });
