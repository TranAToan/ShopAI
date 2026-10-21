import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  Vibration,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Camera } from 'react-native-vision-camera';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import ScannerScreen from '../src/screens/ScannerScreen';
import { useCurrentLocation } from '../src/hooks/useCurrentLocation';
import { getDistanceKm, getShippingTier } from '../src/constants/shipping';
import { hapticSuccess, setHapticsEnabled } from '../src/utils/haptics';

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    requestAuthorization: jest.fn(),
    getCurrentPosition: jest.fn(),
  },
}));
jest.mock('react-native-vision-camera', () => ({
  Camera: Object.assign(
    jest.fn(() => null),
    {
      getCameraPermissionStatus: jest.fn(() => 'granted'),
      requestCameraPermission: jest.fn(async () => 'granted'),
    },
  ),
  useCameraDevice: jest.fn(() => ({ id: 'back' })),
  useCodeScanner: (config: unknown) => config,
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useFocusEffect: (callback: () => void) => {
    const ReactModule = require('react');
    ReactModule.useEffect(callback, [callback]);
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));

let renderer: ReactTestRenderer.ReactTestRenderer;
let onAppState: (state: AppStateStatus) => void;
let location: ReturnType<typeof useCurrentLocation>;
function LocationProbe() {
  location = useCurrentLocation();
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = 'active';
  jest.replaceProperty(Platform, 'OS', 'android');
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      onAppState = listener;
      return { remove: jest.fn() };
    });
  jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
  jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('granted');
  jest.mocked(Camera.requestCameraPermission).mockResolvedValue('granted');
  jest.mocked(Geolocation.getCurrentPosition).mockReset();
  setHapticsEnabled(true);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const mountScanner = async () => {
  const navigation = {
    popTo: jest.fn(),
    goBack: jest.fn(),
    isFocused: jest.fn(() => true),
  };
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <ScannerScreen
          navigation={navigation as never}
          route={{ key: 'scanner', name: 'Scanner' }}
        />
      </ThemeProvider>,
    );
  });
  return navigation;
};

test('scan burst returns exactly one code and one haptic pulse to Home', async () => {
  const navigation = await mountScanner();
  const scan = renderer.root.findByType(Camera).props.codeScanner.onCodeScanned;
  await act(async () => {
    scan([{ value: undefined }]);
    scan([{ value: '8938505974194' }]);
    scan([{ value: '8938505974194' }]);
  });
  expect(navigation.popTo).toHaveBeenCalledTimes(1);
  expect(navigation.popTo).toHaveBeenCalledWith('Home', {
    scannedCode: '8938505974194',
  });
  expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
  expect(Vibration.vibrate).toHaveBeenCalledWith(40);
});

test('camera pauses in background and ignores late scan events', async () => {
  const navigation = await mountScanner();
  const scan = renderer.root.findByType(Camera).props.codeScanner.onCodeScanned;
  await act(async () => {
    AppState.currentState = 'background';
    onAppState('background');
  });
  expect(renderer.root.findByType(Camera).props.isActive).toBe(false);
  scan([{ value: 'late' }]);
  expect(navigation.popTo).not.toHaveBeenCalled();
});

test('denied camera permission recovers on return from Settings without prompting again', async () => {
  jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('denied');
  jest.mocked(Camera.requestCameraPermission).mockResolvedValue('denied');
  await mountScanner();
  expect(renderer.root.findAllByType(Camera)).toHaveLength(0);
  const requests = jest.mocked(Camera.requestCameraPermission).mock.calls
    .length;
  jest.mocked(Camera.getCameraPermissionStatus).mockReturnValue('granted');
  await act(async () => onAppState('active'));
  expect(renderer.root.findByType(Camera).props.isActive).toBe(true);
  expect(Camera.requestCameraPermission).toHaveBeenCalledTimes(requests);
});

test('unfocused scanner ignores callbacks', async () => {
  const navigation = await mountScanner();
  navigation.isFocused.mockReturnValue(false);
  renderer.root
    .findByType(Camera)
    .props.codeScanner.onCodeScanned([{ value: 'late' }]);
  expect(navigation.popTo).not.toHaveBeenCalled();
});

test('haptic failure does not interrupt scan navigation', async () => {
  jest.mocked(Vibration.vibrate).mockImplementation(() => {
    throw new Error('No motor');
  });
  const navigation = await mountScanner();
  await act(async () =>
    renderer.root
      .findByType(Camera)
      .props.codeScanner.onCodeScanned([{ value: 'qr-value' }]),
  );
  expect(navigation.popTo).toHaveBeenCalledWith('Home', {
    scannedCode: 'qr-value',
  });
  setHapticsEnabled(false);
  expect(() => hapticSuccess()).not.toThrow();
});

test('approximate Android location is accepted even when precise permission is denied', async () => {
  jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
    'android.permission.ACCESS_FINE_LOCATION': 'denied',
    'android.permission.ACCESS_COARSE_LOCATION': 'granted',
  } as never);
  jest
    .mocked(Geolocation.getCurrentPosition)
    .mockImplementation(async success => {
      success({ coords: { latitude: 10.7769, longitude: 106.7009 } } as never);
    });
  await act(async () => {
    renderer = ReactTestRenderer.create(<LocationProbe />);
  });
  expect(location.coords).toEqual({ latitude: 10.7769, longitude: 106.7009 });
  expect(location.loading).toBe(false);
  expect(location.error).toBeNull();
});

test('denied GPS permission finishes without calling native location', async () => {
  jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
    'android.permission.ACCESS_FINE_LOCATION': 'never_ask_again',
    'android.permission.ACCESS_COARSE_LOCATION': 'never_ask_again',
  } as never);
  await act(async () => {
    renderer = ReactTestRenderer.create(<LocationProbe />);
  });
  expect(location).toMatchObject({
    coords: null,
    loading: false,
    blocked: true,
  });
  expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
});

test('native GPS failure is handled without an unhandled promise rejection', async () => {
  jest.mocked(Geolocation.getCurrentPosition).mockImplementation(async () => {
    throw new Error('Missing module');
  });
  await act(async () => {
    renderer = ReactTestRenderer.create(<LocationProbe />);
  });
  expect(location.loading).toBe(false);
  expect(location.coords).toBeNull();
  expect(location.error).toBeTruthy();
});

test('GPS timeout releases loading and ignores late results', async () => {
  jest.useFakeTimers();
  await act(async () => {
    renderer = ReactTestRenderer.create(<LocationProbe />);
  });
  const callback = jest.mocked(Geolocation.getCurrentPosition).mock.calls[0][0];
  await act(async () => jest.advanceTimersByTime(30000));
  expect(location.loading).toBe(false);
  expect(location.error).toBeTruthy();
  await act(async () =>
    callback({ coords: { latitude: 10, longitude: 106 } } as never),
  );
  expect(location.coords).toBeNull();
});

test('shipping boundaries and Haversine distance match the chapter', () => {
  expect(getDistanceKm(10.7769, 106.7009, 10.7769, 106.7009)).toBe(0);
  expect(getDistanceKm(0, 0, 0, 1)).toBeCloseTo(111.195, 2);
  expect(getDistanceKm(0, 0, 0, 180)).toBeCloseTo(20015.087, 2);
  expect(
    [0, 5, 5.01, 20, 20.01, 100, 100.01].map(km => getShippingTier(km).fee),
  ).toEqual([15000, 15000, 25000, 25000, 40000, 40000, 60000]);
});
