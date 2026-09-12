import React, { memo, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ShopButton from '@components/ShopButton';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';
import { Product } from '@data/mockProducts';

const { width } = Dimensions.get('window');
const GAP = SIZES.padding;
const CARD_WIDTH = (width - GAP * 3) / 2;

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps): React.JSX.Element {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  const fadeInStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, fadeInStyle]}>
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Typography variant="body2" numberOfLines={2} style={styles.name}>
          {product.name}
        </Typography>
        <Typography variant="body1" color={COLORS.primary} style={styles.price}>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(product.price)}
        </Typography>
        <ShopButton
          title="Mua ngay"
          onPress={() => {}}
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: GAP / 2,
    marginBottom: GAP,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: '100%', height: CARD_WIDTH },
  infoContainer: { padding: 10 },
  name: { color: COLORS.text, height: 40 },
  price: { fontWeight: '700', marginVertical: 8 },
  button: { height: 36 },
  buttonText: { fontSize: 12 },
});

export default memo(ProductCard);
MỌI