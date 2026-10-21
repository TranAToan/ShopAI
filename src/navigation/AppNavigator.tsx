import React, { useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';
import ShopButton from '@components/ShopButton';
import TabIcon from '@components/TabIcon';
import ShopInput from '@components/ui/ShopInput';
import Typography from '@components/ui/Typography';
import { SIZES } from '@constants/theme';
import { useTheme, type ThemeColors } from '@contexts/ThemeContext';
import HomeStackNavigator from '@navigation/HomeStackNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrdersScreen from '@screens/OrdersScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';
import { logoutSafely, useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { authenticate, apiError } from '@services/shopApi';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function useApiLogin(email: string, password: string, name?: string) {
  const login = useAuthStore(state => state.login);
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (busy.current) {
      return;
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 6
    ) {
      Alert.alert(
        'Chưa thể đăng nhập',
        'Nhập email hợp lệ và mật khẩu ít nhất 6 ký tự.',
      );
      return;
    }
    busy.current = true;
    setSubmitting(true);
    try {
      const result = await authenticate(email, password, name);
      await login(result.accessToken);
    } catch (error) {
      Alert.alert('Chưa thể đăng nhập', apiError(error));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };
  return { submitting, submit };
}

function LoginScreen({ navigation }: { navigation: any }): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('demo@shopai.com');
  const [password, setPassword] = useState('123456');
  const { submitting, submit } = useApiLogin(email, password);
  const authError = useAuthStore(state => state.authError);

  return (
    <View style={styles.authContainer}>
      <Typography variant="h1" color={colors.primary} style={styles.title}>
        ShopAI
      </Typography>
      <Typography
        variant="body2"
        color={colors.textLight}
        style={styles.subtitle}
      >
        Khám phá sản phẩm mới
      </Typography>

      <ShopInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <ShopInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="Ít nhất 6 ký tự"
        secureTextEntry
      />

      <ShopButton
        title="Đăng nhập ngay"
        onPress={() => {
          void submit();
        }}
        isLoading={submitting}
        style={styles.primaryButton}
      />
      {authError && (
        <>
          <Typography variant="body2" color={colors.error}>
            {authError}
          </Typography>
          <ShopButton
            title="Xóa phiên đã lưu"
            variant="outline"
            onPress={() => {
              void logoutSafely();
            }}
          />
        </>
      )}
      <ShopButton
        title="Tạo tài khoản"
        variant="outline"
        onPress={() => navigation.navigate('Register')}
        style={styles.secondaryButton}
      />
    </View>
  );
}

function RegisterScreen({
  navigation,
}: {
  navigation: any;
}): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [name, setName] = useState('Nguyễn Văn A');
  const [email, setEmail] = useState('newuser@shopai.com');
  const [password, setPassword] = useState('123456');
  const { submitting, submit } = useApiLogin(email, password, name);

  return (
    <View style={styles.authContainer}>
      <Typography variant="h1" color={colors.primary} style={styles.title}>
        Tạo tài khoản
      </Typography>
      <Typography
        variant="body2"
        color={colors.textLight}
        style={styles.subtitle}
      >
        Bắt đầu mua sắm ngay hôm nay
      </Typography>

      <ShopInput
        label="Họ tên"
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên của bạn"
      />
      <ShopInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <ShopInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="Ít nhất 6 ký tự"
        secureTextEntry
      />

      <ShopButton
        title="Đăng ký"
        onPress={() => {
          void submit();
        }}
        isLoading={submitting}
        style={styles.primaryButton}
      />
      <ShopButton
        title="Đã có tài khoản"
        variant="outline"
        onPress={() => navigation.navigate('Login')}
        style={styles.secondaryButton}
      />
    </View>
  );
}

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {props => <LoginScreen {...props} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {props => <RegisterScreen {...props} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function CartScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const items = useCartStore(state => state.items);
  const totalPrice = useCartStore(state => state.totalPrice);
  return (
    <View style={styles.tabScreen}>
      <Typography variant="h2" color={colors.text} style={styles.tabTitle}>
        Giỏ hàng
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body1" color={colors.textLight}>
          Chưa có sản phẩm nào trong giỏ hàng.
        </Typography>
      ) : (
        <>
          {items.map(item => (
            <Typography
              key={item.id}
              variant="body1"
              color={colors.text}
              style={styles.profileRow}
            >
              {item.name} x {item.quantity}
            </Typography>
          ))}
          <Typography
            variant="body1"
            color={colors.primary}
            style={styles.profileRow}
          >
            Tổng: {new Intl.NumberFormat('vi-VN').format(totalPrice())} đ
          </Typography>
          <ShopButton
            title="Thanh toán"
            onPress={() => navigation.navigate('Checkout')}
            style={styles.logoutButton}
          />
        </>
      )}
    </View>
  );
}

function ProfileScreen({
  onLogout,
}: {
  onLogout: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.tabScreen}>
      <Typography variant="h2" color={colors.text} style={styles.tabTitle}>
        Hồ sơ
      </Typography>
      <Typography variant="body1" color={colors.text} style={styles.profileRow}>
        Nguyễn Văn A
      </Typography>
      <Typography
        variant="body2"
        color={colors.textLight}
        style={styles.profileRow}
      >
        Phi?n ??ng nh?p ???c b?o v?
      </Typography>
      <ShopButton
        title="Đăng xuất"
        variant="outline"
        onPress={onLogout}
        style={styles.logoutButton}
      />
    </View>
  );
}

function MainTabNavigator(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => (
          <TabIcon name={route.name} color={color} size={size} />
        ),
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      })}
      initialRouteName="HomeTab"
    >
      <Tab.Screen
        name="HomeTab"
        options={{ title: 'Trang chủ' }}
        component={HomeStackNavigator}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Giỏ hàng' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Đơn hàng' }}
      />
      <Tab.Screen
        name="Profile"
        options={{ title: 'Tôi' }}
        children={() => (
          <ProfileScreen
            onLogout={() => {
              void logoutSafely();
            }}
          />
        )}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const token = useAuthStore(state => state.token);

  return (
    <NavigationContainer
      theme={{
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
          ...(isDark ? DarkTheme : DefaultTheme).colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          statusBarStyle: isDark ? 'light' : 'dark',
        }}
      >
        {token ? (
          <RootStack.Screen name="Main">
            {() => <MainTabNavigator />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Auth">
            {() => <AuthNavigator />}
          </RootStack.Screen>
        )}
        {token ? (
          <>
            <RootStack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Thanh toán',
              }}
            />
            <RootStack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ headerShown: true, title: 'Chi tiết đơn hàng' }}
            />
          </>
        ) : null}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    authContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: SIZES.padding * 1.5,
      backgroundColor: colors.background,
    },
    title: {
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      marginBottom: SIZES.padding,
      textAlign: 'center',
    },
    primaryButton: {
      marginTop: SIZES.padding,
    },
    secondaryButton: {
      marginTop: SIZES.padding / 2,
    },
    tabScreen: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SIZES.padding,
      justifyContent: 'center',
    },
    tabTitle: {
      marginBottom: SIZES.padding,
    },
    profileRow: {
      marginBottom: 10,
    },
    logoutButton: {
      marginTop: SIZES.padding,
    },
    tabBar: {
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      height: 64,
    },
  });
