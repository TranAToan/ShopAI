import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import ShopButton from '@components/ShopButton';
import ShopInput from '@components/ui/ShopInput';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';
import HomeScreen from '@screens/HomeScreen';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function LoginScreen({
  navigation,
  onLogin,
}: {
  navigation: any;
  onLogin: () => void;
}): React.JSX.Element {
  const [email, setEmail] = useState('admin@shopai.com');
  const [password, setPassword] = useState('123456');

  return (
    <View style={styles.authContainer}>
      <Typography variant="h1" color={COLORS.primary} style={styles.title}>
        ShopAI
      </Typography>
      <Typography variant="body2" color={COLORS.textLight} style={styles.subtitle}>
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

      <ShopButton title="Đăng nhập ngay" onPress={onLogin} style={styles.primaryButton} />
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
  onLogin,
}: {
  navigation: any;
  onLogin: () => void;
}): React.JSX.Element {
  const [name, setName] = useState('Nguyễn Văn A');
  const [email, setEmail] = useState('newuser@shopai.com');
  const [password, setPassword] = useState('123456');

  return (
    <View style={styles.authContainer}>
      <Typography variant="h1" color={COLORS.primary} style={styles.title}>
        Tạo tài khoản
      </Typography>
      <Typography variant="body2" color={COLORS.textLight} style={styles.subtitle}>
        Bắt đầu mua sắm ngay hôm nay
      </Typography>

      <ShopInput label="Họ tên" value={name} onChangeText={setName} placeholder="Nhập tên của bạn" />
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

      <ShopButton title="Đăng ký" onPress={onLogin} style={styles.primaryButton} />
      <ShopButton
        title="Đã có tài khoản"
        variant="outline"
        onPress={() => navigation.navigate('Login')}
        style={styles.secondaryButton}
      />
    </View>
  );
}

function AuthNavigator({ onLogin }: { onLogin: () => void }): React.JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {props => <LoginScreen {...props} onLogin={onLogin} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {props => <RegisterScreen {...props} onLogin={onLogin} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function CartScreen(): React.JSX.Element {
  return (
    <View style={styles.tabScreen}>
      <Typography variant="h2" color={COLORS.text} style={styles.tabTitle}>
        Giỏ hàng
      </Typography>
      <Typography variant="body1" color={COLORS.textLight}>
        Chưa có sản phẩm nào trong giỏ hàng.
      </Typography>
    </View>
  );
}

function ProfileScreen({ onLogout }: { onLogout: () => void }): React.JSX.Element {
  return (
    <View style={styles.tabScreen}>
      <Typography variant="h2" color={COLORS.text} style={styles.tabTitle}>
        Hồ sơ
      </Typography>
      <Typography variant="body1" color={COLORS.text} style={styles.profileRow}>
        Nguyễn Văn A
      </Typography>
      <Typography variant="body2" color={COLORS.textLight} style={styles.profileRow}>
        admin@shopai.com
      </Typography>
      <ShopButton title="Đăng xuất" variant="outline" onPress={onLogout} style={styles.logoutButton} />
    </View>
  );
}

function MainTabNavigator({ onLogout }: { onLogout: () => void }): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
      }}
      initialRouteName="HomeTab"
    >
      <Tab.Screen
        name="HomeTab"
        options={{ title: 'Trang chủ' }}
        component={HomeScreen}
      />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
      <Tab.Screen
        name="Profile"
        options={{ title: 'Tôi' }}
        children={() => <ProfileScreen onLogout={onLogout} />}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main">
            {() => <MainTabNavigator onLogout={handleLogout} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Auth">
            {() => <AuthNavigator onLogin={handleLogin} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding * 1.5,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 64,
  },
});
