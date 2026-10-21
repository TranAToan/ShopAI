import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import ShopButton from '@components/ShopButton';
import { useTheme } from '@contexts/ThemeContext';
import { logoutSafely, useAuthStore } from '@store/useAuthStore';
import {
  authenticateDeviceCredential,
  cancelDeviceCredential,
} from '@services/deviceCredential';

let authenticationInFlight: {
  sessionId: number;
  lockEpoch: number;
  promise: Promise<boolean>;
} | null = null;

export default function BiometricGateScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const sessionId = useAuthStore(state => state.sessionId);
  const lockEpoch = useAuthStore(state => state.lockEpoch);
  const [checking, setChecking] = useState(false);
  const [hint, setHint] = useState(
    'Xác thực bằng vân tay hoặc mã khóa màn hình điện thoại để tiếp tục.',
  );
  const mounted = useRef(false);
  const busy = useRef(false);
  const authenticate = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setChecking(true);
    const isCurrent = () =>
      mounted.current &&
      useAuthStore.getState().sessionId === sessionId &&
      useAuthStore.getState().lockEpoch === lockEpoch;
    try {
      if (Platform.OS === 'android') {
        setHint(
          'Nhập mã PIN khóa màn hình điện thoại để mở ShopAI. Mã được Android xác thực.',
        );
        if (
          authenticationInFlight &&
          (authenticationInFlight.sessionId !== sessionId ||
            authenticationInFlight.lockEpoch !== lockEpoch)
        ) {
          throw new Error('A previous authentication is finishing.');
        }
        if (!authenticationInFlight) {
          authenticationInFlight = {
            sessionId,
            lockEpoch,
            promise: authenticateDeviceCredential(),
          };
        }
        const request = authenticationInFlight;
        try {
          const success = await request.promise;
          if (!isCurrent()) {
            return;
          }
          if (success) {
            useAuthStore.getState().setIsUnlocked(true, sessionId, lockEpoch);
          } else {
            setHint(
              'Chưa mở khóa. Bạn nhập lại mã PIN điện thoại hoặc đăng nhập bằng mật khẩu.',
            );
          }
        } finally {
          if (authenticationInFlight === request) {
            authenticationInFlight = null;
          }
        }
        return;
      }
      const [hasHardware, enrolled, types, level] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.getEnrolledLevelAsync(),
      ]);
      if (!isCurrent()) {
        return;
      }
      const hasDeviceCredential =
        level >= LocalAuthentication.SecurityLevel.SECRET;
      if ((!hasHardware || !enrolled) && !hasDeviceCredential) {
        setHint(
          'Bạn thiết lập mã khóa màn hình trong Cài đặt điện thoại rồi thử lại, hoặc đăng nhập bằng mật khẩu.',
        );
        return;
      }
      const label =
        enrolled &&
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
          ? Platform.OS === 'ios'
            ? 'Face ID'
            : 'khuôn mặt'
          : enrolled
          ? 'vân tay'
          : 'mã khóa màn hình điện thoại';
      setHint(`Xác thực bằng ${label} hoặc mã PIN điện thoại để mở ShopAI.`);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để mở ShopAI',
        promptDescription:
          'Dùng vân tay hoặc mã PIN khóa màn hình điện thoại của bạn.',
        cancelLabel: 'Huỷ',
        fallbackLabel: 'Dùng mã PIN điện thoại',
        disableDeviceFallback: false,
      });
      if (!isCurrent()) {
        return;
      }
      if (result.success) {
        useAuthStore.getState().setIsUnlocked(true, sessionId, lockEpoch);
      } else {
        setHint(
          result.error === 'lockout'
            ? 'Sinh trắc học đang tạm khóa. Bạn thử lại bằng mã PIN điện thoại hoặc đăng nhập lại.'
            : 'Xác thực chưa thành công. Bạn thử lại hoặc đăng nhập bằng mật khẩu.',
        );
      }
    } catch (error) {
      if (isCurrent()) {
        const missingPin =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'NO_DEVICE_CREDENTIAL';
        setHint(
          missingPin
            ? 'Bạn thiết lập PIN 6 số khóa màn hình trong Cài đặt Android rồi thử lại. Có thể đăng nhập bằng mật khẩu để tiếp tục.'
            : 'Chưa thể xác thực trên thiết bị. Bạn thử lại hoặc đăng nhập bằng mật khẩu.',
        );
      }
    } finally {
      busy.current = false;
      if (isCurrent()) {
        setChecking(false);
      }
    }
  }, [sessionId, lockEpoch]);
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      void authenticate();
    }, 0);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
      if (Platform.OS === 'android') {
        void cancelDeviceCredential();
      }
    };
  }, [authenticate]);
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={styles.icon}>🔒</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        ShopAI đang khóa
      </Text>
      <Text style={[styles.hint, { color: colors.textLight }]}>{hint}</Text>
      {checking && (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      )}
      <ShopButton
        title="Thử lại"
        onPress={() => {
          void authenticate();
        }}
        disabled={checking}
        style={styles.button}
      />
      <ShopButton
        title="Đăng nhập bằng mật khẩu"
        variant="outline"
        onPress={() => {
          void logoutSafely();
        }}
        style={styles.button}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  icon: { fontSize: 56, marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  hint: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    marginVertical: 22,
  },
  spinner: { marginBottom: 16 },
  button: { width: '100%', maxWidth: 360, marginBottom: 14 },
});
