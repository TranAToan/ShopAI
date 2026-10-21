import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import ShopButton from '@components/ShopButton';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { fetchProduct } from '@services/productApi';
import { apiError } from '@services/shopApi';
import { useCartStore } from '@store/useCartStore';

type ProductDetailRoute = RouteProp<
  { ProductDetail: { productId: string } },
  'ProductDetail'
>;

export default function ProductDetailScreen(): React.JSX.Element {
  const { params } = useRoute<ProductDetailRoute>();
  const { colors } = useTheme();
  const addItem = useCartStore(state => state.addItem);
  const query = useQuery({
    queryKey: ['product', params.productId],
    queryFn: ({ signal }) => fetchProduct(params.productId, signal),
  });
  const product = query.data;

  if (!product) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Typography variant="body1" color={colors.text}>
          {query.isPending ? 'Đang tải sản phẩm...' : apiError(query.error)}
        </Typography>
        {query.isError && (
          <ShopButton
            title="Thử lại"
            onPress={() => {
              void query.refetch();
            }}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Image
        source={{ uri: product.image }}
        style={[styles.image, { backgroundColor: colors.surface }]}
        resizeMode="cover"
      />
      <Typography variant="h2" color={colors.text} style={styles.name}>
        {product.name}
      </Typography>
      <Typography variant="h2" color={colors.primary} style={styles.price}>
        {new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(product.price)}
      </Typography>
      <ShopButton title="Thêm vào giỏ hàng" onPress={() => addItem(product)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SIZES.padding },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface,
  },
  name: { marginTop: SIZES.padding },
  price: { marginVertical: SIZES.padding },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
