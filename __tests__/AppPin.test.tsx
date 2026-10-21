import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { APP_PIN_KEY, verifyAppPin } from '../src/services/appPin';
import PinGateScreen from '../src/screens/PinGateScreen';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useAuthStore } from '../src/store/useAuthStore';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
const hash = 'b'.repeat(64);
const record = { salt: 'a'.repeat(48), hash, failures: 0, blockedUntil: 0 };
let renderer: TestRenderer.ReactTestRenderer | undefined;
beforeEach(async () => {
  jest.clearAllMocks();
  NativeModules.ShopDeviceCredential = { deriveAppPin: jest.fn(async () => hash) };
  await SecureStore.setItemAsync(APP_PIN_KEY, JSON.stringify(record));
  useAuthStore.setState({ token: 'session', sessionId: 123, lockEpoch: 0, isUnlocked: false });
});
afterEach(async () => {
  if (renderer) { await act(async () => renderer!.unmount()); }
  renderer = undefined;
});
test('valid verifier unlocks, a mismatch does not, and attempts persist', async () => {
  expect(await verifyAppPin('123456')).toBe(true);
  NativeModules.ShopDeviceCredential.deriveAppPin.mockResolvedValue('c'.repeat(64));
  expect(await verifyAppPin('123456')).toBe(false);
  expect(JSON.parse((await SecureStore.getItemAsync(APP_PIN_KEY))!).failures).toBe(1);
});
test('five failed attempts block native verification for 30 seconds', async () => {
  NativeModules.ShopDeviceCredential.deriveAppPin.mockResolvedValue('c'.repeat(64));
  for (let i = 0; i < 5; i++) { expect(await verifyAppPin('123456')).toBe(false); }
  await expect(verifyAppPin('123456')).rejects.toThrow('Thử lại sau');
  expect(NativeModules.ShopDeviceCredential.deriveAppPin).toHaveBeenCalledTimes(5);
});
test('corrupt storage and missing native module fail closed', async () => {
  await SecureStore.setItemAsync(APP_PIN_KEY, '{}');
  await expect(verifyAppPin('123456')).rejects.toThrow();
  await SecureStore.setItemAsync(APP_PIN_KEY, JSON.stringify(record));
  NativeModules.ShopDeviceCredential = undefined;
  await expect(verifyAppPin('123456')).rejects.toThrow('APK mới');
});
test('failed secure write never reports successful PIN verification', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('write failed'));
  await expect(verifyAppPin('123456')).rejects.toThrow('write failed');
});
test('a late correct PIN after logout cannot unlock a different session', async () => {
  let complete!: (value: string) => void;
  NativeModules.ShopDeviceCredential.deriveAppPin.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  await act(async () => { renderer = TestRenderer.create(<ThemeProvider><PinGateScreen /></ThemeProvider>); });
  await act(async () => { renderer!.root.findByProps({ testID: 'app-pin-input' }).props.onChangeText('123456'); });
  await act(async () => { renderer!.root.findAll(node => node.props.title === 'Mở khóa')[0].props.onPress(); });
  await act(async () => {
    useAuthStore.setState({ token: null, sessionId: 124, isUnlocked: false });
    complete(hash);
    await Promise.resolve();
  });
  expect(useAuthStore.getState().isUnlocked).toBe(false);
});
