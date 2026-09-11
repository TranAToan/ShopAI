import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '@components/ProductCard';
import ShopButton from '@components/ShopButton';
import ShopInput from '@components/ui/ShopInput';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';
import { MOCK_PRODUCTS } from '@data/mockProducts';
import { useTheme } from '@contexts/ThemeContext';

function HomeScreen(): React.JSX.Element {
  const { colors, isDark, toggleTheme } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2000000);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        product =>
          product.name.toLowerCase().includes(keyword.toLowerCase()) &&
          product.price <= maxPrice,
      ),
    [keyword, maxPrice, products],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setProducts([...MOCK_PRODUCTS].sort(() => Math.random() - 0.5));
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        <FlashList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          numColumns={2}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
              <View style={styles.titleRow}>
                <View>
                  <Typography variant="h1" color={colors.primary}>
                    ShopAI
                  </Typography>
                  <Typography variant="body2" color={colors.textLight}>
                    Khám phá sản phẩm mới
                  </Typography>
                </View>
                <ShopButton
                  title={isDark ? 'Sáng' : 'Tối'}
                  onPress={toggleTheme}
                  variant="secondary"
                  style={styles.themeButton}
                />
              </View>
              <View style={styles.searchRow}>
                <ShopInput
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="Tìm sản phẩm..."
                  autoCapitalize="none"
                  containerStyle={styles.searchInput}
                />
                <ShopButton
                  title="Lọc"
                  onPress={() => setFilterVisible(true)}
                  variant="outline"
                  textStyle={styles.filterText}
                  style={styles.filterButton}
                />
              </View>
              <Typography variant="small" color={colors.textLight}>
                {filteredProducts.length} sản phẩm
              </Typography>
            </View>
          }
          ListEmptyComponent={
            <Typography
              variant="body2"
              color={colors.textLight}
              style={styles.empty}
            >
              Không tìm thấy sản phẩm phù hợp
            </Typography>
          }
        />

        <Modal
          visible={filterVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFilterVisible(false)}
          >
            <Pressable
              style={[styles.sheet, { backgroundColor: colors.surface }]}
              onPress={event => event.stopPropagation()}
            >
              <Typography variant="h2" color={colors.text}>
                Bộ lọc sản phẩm
              </Typography>
              <Typography
                variant="body2"
                color={colors.textLight}
                style={styles.filterLabel}
              >
                Giá tối đa: {new Intl.NumberFormat('vi-VN').format(maxPrice)} đ
              </Typography>
              <View style={styles.filterOptions}>
                {[1000000, 1500000, 2000000].map(price => (
                  <ShopButton
                    key={price}
                    title={`${price / 1000000} triệu`}
                    onPress={() => setMaxPrice(price)}
                    variant={maxPrice === price ? 'primary' : 'outline'}
                    textStyle={
                      maxPrice === price ? undefined : styles.filterText
                    }
                    style={styles.optionButton}
                  />
                ))}
              </View>
              <ShopButton
                title="Áp dụng"
                onPress={() => setFilterVisible(false)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: SIZES.padding / 2, paddingBottom: 24 },
  header: { padding: SIZES.padding, marginBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeButton: { width: 76 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  searchInput: { flex: 1, marginBottom: 8 },
  filterButton: { width: 76, marginTop: 0 },
  filterText: { color: COLORS.primary },
  empty: { textAlign: 'center', marginTop: 32 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  filterLabel: { marginTop: 16 },
  filterOptions: { flexDirection: 'row', gap: 8, marginVertical: 20 },
  optionButton: { flex: 1 },
});

export default HomeScreen;
