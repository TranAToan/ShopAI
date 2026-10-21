import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopButton from '@components/ShopButton';
import Typography from '@components/ui/Typography';
import { SIZES } from '@constants/theme';
import { useTheme, type ThemeColors } from '@contexts/ThemeContext';
import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';
import { fetchOrder, payOrder, apiError } from '@services/shopApi';

export default function OrderDetailScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const route = useRoute<any>();
  const sessionId = useAuthStore(state => state.sessionId);
  const client = useQueryClient();
  const busy = useRef(false);
  const query = useQuery({
    queryKey: ['order', sessionId, route.params.orderId],
    queryFn: ({ signal }) => fetchOrder(route.params.orderId, signal),
  });
  const order = query.data;
  const payment = useMutation({
    mutationFn: () => payOrder(route.params.orderId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['order', sessionId] });
      void client.invalidateQueries({ queryKey: ['orders', sessionId] });
    },
  });
  if (!order)
    return (
      <SafeAreaView>
        <Typography variant="body1">
          {query.isPending ? 'Đang tải hóa đơn...' : apiError(query.error)}
        </Typography>
        <ShopButton
          title="Tải lại"
          onPress={() => {
            void query.refetch();
          }}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Typography variant="h2" color={colors.primary}>
          Hóa đơn {order.id}
        </Typography>
        <Typography variant="body1" color={colors.text} style={styles.row}>
          Trạng thái: {order.status}
        </Typography>
        {order.items.map(item => (
          <Typography
            key={item.id}
            variant="body2"
            color={colors.text}
            style={styles.row}
          >
            {item.name} x {item.quantity}
          </Typography>
        ))}
        <Typography variant="h2" color={colors.primary} style={styles.row}>
          Tổng: {new Intl.NumberFormat('vi-VN').format(order.total)} đ
        </Typography>
        {order.status === 'PENDING' && (
          <ShopButton
            title="Thanh toán giả lập"
            onPress={() => {
              if (busy.current) return;
              busy.current = true;
              payment.mutate(undefined, {
                onSettled: () => {
                  busy.current = false;
                },
              });
            }}
            isLoading={payment.isPending}
            style={styles.button}
          />
        )}
        {payment.isError && (
          <Typography color={colors.error}>
            {apiError(payment.error)}
          </Typography>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { padding: SIZES.padding },
    row: { marginTop: 16 },
    button: { marginTop: 28 },
  });
