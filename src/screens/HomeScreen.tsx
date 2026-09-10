import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopButton from '@components/ShopButton';
import ShopInput from '@components/ui/ShopInput';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';
import { useCountdown } from '@hooks/useCountdown';
import { useTheme } from '@contexts/ThemeContext';
import { fetchSamplePosts, PostItem } from '@services/productApi';

function HomeScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);
  const { timeLeft, isFinished } = useCountdown(60);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSamplePosts();
      if (aliveRef.current) setPosts(data);
    } catch {
      if (aliveRef.current) setError(t('home.networkError'));
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    return () => {
      aliveRef.current = false;
    };
  }, [load]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(keyword.toLowerCase()),
  );

  const switchLanguage = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={!loading && !error ? filteredPosts : []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
              <Typography variant="h1" color={colors.primary}>
                {t('home.title')}
              </Typography>
              <Typography
                variant="body2"
                color={colors.textLight}
                style={styles.caption}
              >
                {t('home.caption')}
              </Typography>
              <View style={styles.controls}>
                <ShopButton
                  title={isDark ? t('home.lightMode') : t('home.darkMode')}
                  onPress={toggleTheme}
                  variant="secondary"
                  style={styles.controlButton}
                />
                <ShopButton
                  title={t('home.language')}
                  onPress={switchLanguage}
                  variant="outline"
                  textStyle={{ color: colors.primary }}
                  style={styles.controlButton}
                />
              </View>
            </View>
            <Image
              source={{ uri: 'https://picsum.photos/800/200' }}
              style={styles.banner}
              resizeMode="cover"
            />
            <View style={styles.saleRow}>
              <Typography variant="body2" color={colors.textLight}>
                {isFinished
                  ? t('home.expired')
                  : t('home.sale', { seconds: timeLeft })}
              </Typography>
            </View>
            <ShopInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder={t('home.search')}
              autoCapitalize="none"
              containerStyle={styles.inputWrap}
            />
            <ShopButton
              title={t('home.refresh')}
              onPress={load}
              isLoading={loading}
              style={styles.refresh}
            />
            {loading && (
              <LottieView
                source={require('@assets/lottie/loading.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            )}
            {error && (
              <Typography
                variant="body2"
                color={COLORS.error}
                style={styles.error}
              >
                {error}
              </Typography>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Typography
              variant="body2"
              color={colors.textLight}
              style={styles.empty}
            >
              {t('home.empty')}
            </Typography>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Typography variant="h3" color={colors.text} numberOfLines={2}>
              {item.title}
            </Typography>
            <Typography
              variant="body2"
              color={colors.textLight}
              numberOfLines={2}
              style={styles.cardBody}
            >
              {item.body}
            </Typography>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 24 },
  header: { padding: SIZES.padding },
  caption: { marginTop: 4 },
  controls: { flexDirection: 'row', gap: 8, marginTop: 16 },
  controlButton: { flex: 1 },
  banner: { width: '100%', height: 120, marginTop: 8 },
  saleRow: { alignItems: 'center', paddingTop: 12 },
  inputWrap: { margin: SIZES.padding, marginBottom: 8 },
  refresh: { marginHorizontal: SIZES.padding, marginBottom: 8 },
  lottie: { width: 64, height: 64, alignSelf: 'center' },
  error: { textAlign: 'center', margin: SIZES.padding },
  card: {
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    padding: 14,
    borderRadius: SIZES.radius,
  },
  cardBody: { marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 24 },
});

export default HomeScreen;
