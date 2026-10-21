import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopButton from '@components/ShopButton';
import { useTheme } from '@contexts/ThemeContext';
import { logoutSafely, useAuthStore } from '@store/useAuthStore';
import { verifyAppPin } from '@services/appPin';

export default function PinGateScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const sessionId = useAuthStore(state => state.sessionId);
  const lockEpoch = useAuthStore(state => state.lockEpoch);
  const [pin, setPin] = useState('');
  const [hint, setHint] = useState('Nhập PIN 6 số riêng của ShopAI.');
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const unlock = async () => {
    if (busy.current || pin.length !== 6) {
      return;
    }
    busy.current = true;
    setChecking(true);
    const candidate = pin;
    setPin('');
    const isCurrent = () =>
      mounted.current &&
      useAuthStore.getState().sessionId === sessionId &&
      useAuthStore.getState().lockEpoch === lockEpoch;
    try {
      const success = await verifyAppPin(candidate);
      if (!isCurrent()) {
        return;
      }
      if (success) {
        useAuthStore.getState().setIsUnlocked(true, sessionId, lockEpoch);
      } else {
        setHint('PIN chưa đúng. Nhập lại; sai 5 lần sẽ tạm khóa 30 giây.');
      }
    } catch (error) {
      if (isCurrent()) {
        setHint(
          error instanceof Error
            ? error.message
            : 'Chưa xác thực được PIN. Thử lại.',
        );
      }
    } finally {
      busy.current = false;
      if (isCurrent()) {
        setChecking(false);
      }
    }
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Mở khóa ShopAI
        </Text>
        <Text style={[styles.hint, { color: colors.textLight }]}>{hint}</Text>
        <TextInput
          testID="app-pin-input"
          accessibilityLabel="PIN ShopAI 6 số"
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={pin}
          onChangeText={value =>
            setPin(value.replace(/[^0-9]/g, '').slice(0, 6))
          }
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          autoCorrect={false}
          editable={!checking}
          onSubmitEditing={() => {
            void unlock();
          }}
        />
        <ShopButton
          title="Mở khóa"
          disabled={pin.length !== 6}
          isLoading={checking}
          onPress={() => {
            void unlock();
          }}
          style={styles.button}
        />
        <ShopButton
          title="Đăng xuất"
          variant="outline"
          onPress={() => {
            void logoutSafely();
          }}
          style={styles.button}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28 },
  content: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  hint: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    marginVertical: 22,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: { marginBottom: 14 },
});
