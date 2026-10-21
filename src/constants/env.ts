import { NativeModules } from 'react-native';
export type AppEnv = 'development' | 'staging' | 'production';
const native = NativeModules.ShopDeviceCredential as
  | {
      appEnvironment?: AppEnv;
      apiBaseUrl?: string;
      firebaseConfigured?: boolean;
      updatesConfigured?: boolean;
    }
  | undefined;
// Release APKs default to staging explicitly; __DEV__ never selects a fake URL.
export const APP_ENV: AppEnv =
  native?.appEnvironment || (__DEV__ ? 'development' : 'staging');
const LAN_URL = 'http://192.168.20.69:3000';
const API_URLS: Record<AppEnv, string> = {
  development: LAN_URL,
  staging: LAN_URL,
  production: native?.apiBaseUrl || '',
};
export const API_BASE_URL = native?.apiBaseUrl || API_URLS[APP_ENV];
export const ENABLE_CRASHLYTICS =
  !!native?.firebaseConfigured && APP_ENV !== 'development';
export const ENABLE_OTA_UPDATE =
  !!native?.updatesConfigured && APP_ENV !== 'development';
export const APP_VERSION = '1.1.0';
