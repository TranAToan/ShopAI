import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Typography from '@components/ui/Typography';
import { SIZES } from '@constants/theme';
import { useTheme, type ThemeColors } from '@contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';
import { fetchOrders, apiError } from '@services/shopApi';
import ShopButton from '@components/ShopButton';

export default function OrdersScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const sessionId = useAuthStore(state => state.sessionId);
  const query = useQuery({
    queryKey: ['orders', sessionId],
    queryFn: ({ signal }) => fetchOrders(signal),
  });
  const orders = query.data || [];
  return (
    <SafeAreaView style={styles.safe}>
      <Typography variant="h2" color={colors.primary} style={styles.title}>
        Đơn hàng của tôi
      </Typography>
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Typography variant="body1" color={colors.textLight}>
            {query.isPending
              ? 'Đang tải đơn hàng...'
              : query.isError
              ? apiError(query.error)
              : 'Chưa có đơn hàng.'}
          </Typography>
          <ShopButton
            title="Tải lại"
            onPress={() => {
              void query.refetch();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('OrderDetail', { orderId: item.id })
              }
            >
              <Typography variant="body1" color={colors.text}>
                {item.id}
              </Typography>
              <Typography variant="body2" color={colors.primary}>
                {item.status} -{' '}
                {new Intl.NumberFormat('vi-VN').format(item.total)} đ
              </Typography>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    title: { padding: SIZES.padding },
    list: { padding: SIZES.padding },
    card: {
      backgroundColor: colors.surface,
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
      marginBottom: 12,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
