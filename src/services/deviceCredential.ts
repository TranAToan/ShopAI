import { NativeModules } from 'react-native';

type DeviceCredential = {
  authenticate: () => Promise<boolean>;
  cancel: () => Promise<void>;
};
function nativeModule(): DeviceCredential {
  const module = NativeModules.ShopDeviceCredential as
    | DeviceCredential
    | undefined;
  if (!module) {
    throw new Error('Device credential native module is unavailable.');
  }
  return module;
}
export function authenticateDeviceCredential(): Promise<boolean> {
  return nativeModule().authenticate();
}
export async function cancelDeviceCredential(): Promise<void> {
  try {
    await nativeModule().cancel();
  } catch {
    /* The gate still remains locked. */
  }
}
