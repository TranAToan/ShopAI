import { NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const APP_PIN_KEY = 'SHOP_APP_PIN_V1';
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
// Initial verifier for this personal build; never store the plaintext PIN.
const initial = {
  salt: 'a61f7f143d7403c3af96ec699d31e740107ef6700e104a21',
  hash: 'd857ac4b565c167560907ba6dc1c4715fa14f6604e3a2fba07240cb693008145',
  failures: 0,
  blockedUntil: 0,
};
type PinRecord = typeof initial;
let queue: Promise<unknown> = Promise.resolve();

async function readRecord(): Promise<PinRecord> {
  const stored = await SecureStore.getItemAsync(APP_PIN_KEY, options);
  if (!stored) {
    await SecureStore.setItemAsync(
      APP_PIN_KEY,
      JSON.stringify(initial),
      options,
    );
    return { ...initial };
  }
  const record: PinRecord = JSON.parse(stored);
  if (
    !/^[a-f0-9]{48}$/.test(record.salt) ||
    !/^[a-f0-9]{64}$/.test(record.hash) ||
    !Number.isInteger(record.failures) ||
    record.failures < 0 ||
    !Number.isFinite(record.blockedUntil) ||
    record.blockedUntil < 0
  ) {
    throw new Error('Không đọc được dữ liệu PIN an toàn.');
  }
  return record;
}

export function verifyAppPin(pin: string): Promise<boolean> {
  const request = queue.then(async () => {
    if (!/^[0-9]{6}$/.test(pin)) {
      throw new Error('Nhập đủ 6 chữ số.');
    }
    const record = await readRecord();
    if (record.blockedUntil > Date.now()) {
      throw new Error(
        `Thử lại sau ${Math.ceil(
          (record.blockedUntil - Date.now()) / 1000,
        )} giây.`,
      );
    }
    const native = NativeModules.ShopDeviceCredential as
      | {
          deriveAppPin?: (value: string, salt: string) => Promise<string>;
        }
      | undefined;
    if (!native?.deriveAppPin) {
      throw new Error('Cần cài bản APK mới để dùng PIN ShopAI.');
    }
    const hash = await native.deriveAppPin(pin, record.salt);
    const success = hash === record.hash;
    const failures = success ? 0 : record.failures + 1;
    await SecureStore.setItemAsync(
      APP_PIN_KEY,
      JSON.stringify({
        ...record,
        failures,
        blockedUntil: !success && failures >= 5 ? Date.now() + 30000 : 0,
      }),
      options,
    );
    return success;
  });
  queue = request.catch(() => undefined);
  return request;
}
