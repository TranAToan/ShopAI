import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Typography from '@components/ui/Typography';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import { useTheme } from '@contexts/ThemeContext';
import {
  DEFAULT_SHIPPING_FEE,
  WAREHOUSE_COORDS,
  getDistanceKm,
  getShippingTier,
} from '@constants/shipping';
import { SIZES } from '@constants/theme';

const formatVnd = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

export default function LocationBadge(): React.JSX.Element {
  const { coords, loading, error, blocked, refresh, openSettings } =
    useCurrentLocation();
  const { colors } = useTheme();
  const badgeStyle = [
    styles.badge,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  if (loading)
    return (
      <View style={badgeStyle} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Typography
          variant="small"
          color={colors.textLight}
          style={styles.content}
        >
          Đang xác định vị trí của bạn...
        </Typography>
      </View>
    );

  if (error || !coords)
    return (
      <Pressable
        style={badgeStyle}
        onPress={blocked ? openSettings : refresh}
        accessibilityRole="button"
      >
        <Typography
          variant="small"
          color={colors.textLight}
          style={styles.content}
        >
          {error ?? 'Chưa rõ vị trí'} — tạm tính phí ship{' '}
          {formatVnd(DEFAULT_SHIPPING_FEE)}
        </Typography>
        <Typography variant="small" color={colors.primary}>
          {blocked ? 'Mở Cài đặt' : 'Thử lại'}
        </Typography>
      </Pressable>
    );

  const distanceKm = getDistanceKm(
    coords.latitude,
    coords.longitude,
    WAREHOUSE_COORDS.latitude,
    WAREHOUSE_COORDS.longitude,
  );
  const tier = getShippingTier(distanceKm);
  return (
    <Pressable
      style={badgeStyle}
      onPress={refresh}
      accessibilityRole="button"
      accessibilityLabel="Làm mới vị trí và phí ship ước tính"
    >
      <View style={styles.content}>
        <Typography variant="body2">
          Cách kho {distanceKm.toFixed(1)} km · Ship {formatVnd(tier.fee)}
        </Typography>
        <Typography variant="small" color={colors.textLight}>
          {tier.label}
        </Typography>
        <Typography variant="small" color={colors.textLight}>
          ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
        </Typography>
        <Typography variant="small" color={colors.textLight}>
          Ước tính theo khoảng cách đường chim bay
        </Typography>
      </View>
      <Typography variant="small" color={colors.primary}>
        Làm mới
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    gap: 12,
  },
  content: { flex: 1, gap: 4 },
});
