/* eslint-env jest */
jest.mock('@react-native-firebase/app', () => ({getApps: jest.fn(() => [])}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({})), log: jest.fn(), recordError: jest.fn(),
  setAttributes: jest.fn(async () => undefined),
  setCrashlyticsCollectionEnabled: jest.fn(async () => undefined), crash: jest.fn(),
}));
jest.mock('expo-updates', () => ({
  isEnabled: false, checkForUpdateAsync: jest.fn(), fetchUpdateAsync: jest.fn(),
}));
// Native APIs are mocked only in Jest. Device acceptance tests are separate.
jest.mock('expo-secure-store', () => {
  const items = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: jest.fn(async key => items.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      items.set(key, value);
    }),
    deleteItemAsync: jest.fn(async key => {
      items.delete(key);
    }),
  };
});
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  SecurityLevel: { NONE: 0, SECRET: 1 },
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  supportedAuthenticationTypesAsync: jest.fn(async () => []),
  getEnrolledLevelAsync: jest.fn(async () => 0),
  authenticateAsync: jest.fn(async () => ({
    success: false,
    error: 'user_cancel',
  })),
  cancelAuthenticate: jest.fn(async () => undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => items.get(key) ?? null),
      setItem: jest.fn(async (key, value) => {
        items.set(key, value);
      }),
      removeItem: jest.fn(async key => {
        items.delete(key);
      }),
    },
  };
});
jest.mock('react-native-vision-camera', () => ({
  Camera: Object.assign(
    jest.fn(() => null),
    {
      getCameraPermissionStatus: jest.fn(() => 'denied'),
      requestCameraPermission: jest.fn(async () => 'denied'),
    },
  ),
  useCameraDevice: jest.fn(() => undefined),
  useCodeScanner: config => config,
}));
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    getCurrentPosition: jest.fn(),
    requestAuthorization: jest.fn(),
  },
}));
