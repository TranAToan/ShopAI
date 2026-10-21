import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { useAppLock, APP_LOCK_TIMEOUT_MS } from '../src/hooks/useAppLock';
import { useAuthStore } from '../src/store/useAuthStore';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import BiometricGateScreen from '../src/screens/BiometricGateScreen';
import {
  authenticateDeviceCredential,
  cancelDeviceCredential,
} from '../src/services/deviceCredential';

jest.mock('../src/services/deviceCredential', () => ({
  authenticateDeviceCredential: jest.fn(),
  cancelDeviceCredential: jest.fn(async () => undefined),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));

let renderer: TestRenderer.ReactTestRenderer | undefined;
let listener: (state: AppStateStatus) => void;
let clock: number;
function Probe() {
  useAppLock();
  return null;
}
beforeEach(() => {
  clock = 1000;
  jest.clearAllMocks();
  AppState.currentState = 'active';
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(Date, 'now').mockImplementation(() => clock);
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, callback) => {
      listener = callback;
      return { remove: jest.fn() };
    });
  useAuthStore.setState({
    token: 'test-session',
    isLoading: false,
    isUnlocked: true,
    sessionId: 100,
    lockEpoch: 0,
  });
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer!.unmount());
  }
  renderer = undefined;
  jest.restoreAllMocks();
});

test('short background interval keeps the current unlock state', async () => {
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  listener('background');
  clock += 10000;
  await act(async () => listener('active'));
  expect(useAuthStore.getState().isUnlocked).toBe(true);
});

test('inactive then background keeps the FIRST timestamp and locks after two minutes', async () => {
  expect(APP_LOCK_TIMEOUT_MS).toBe(120000);
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  listener('inactive');
  clock += 100000;
  listener('background');
  clock += 21000;
  await act(async () => listener('active'));
  expect(useAuthStore.getState().isUnlocked).toBe(false);
});

test('short resume never unlocks an already locked session', async () => {
  useAuthStore.setState({ isUnlocked: false });
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  listener('background');
  clock += 10;
  await act(async () => listener('active'));
  expect(useAuthStore.getState().isUnlocked).toBe(false);
});

async function mountGate() {
  useAuthStore.setState({ isUnlocked: false });
  await act(async () => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <BiometricGateScreen />
      </ThemeProvider>,
    );
    await new Promise<void>(resolve => setTimeout(() => resolve(), 10));
  });
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 10));
  });
}

test('Android credential success unlocks without using a biometric bypass', async () => {
  jest.mocked(authenticateDeviceCredential).mockResolvedValueOnce(true);
  await mountGate();
  expect(authenticateDeviceCredential).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().isUnlocked).toBe(true);
});

test.each([false, 'native-error', 'no-pin'])(
  'cancel/failure/missing PIN keeps the gate locked: %s',
  async outcome => {
    if (outcome === false) {
      jest.mocked(authenticateDeviceCredential).mockResolvedValueOnce(false);
    } else {
      jest.mocked(authenticateDeviceCredential).mockRejectedValueOnce({
        code:
          outcome === 'no-pin' ? 'NO_DEVICE_CREDENTIAL' : 'AUTH_UNAVAILABLE',
      });
    }
    await mountGate();
    expect(useAuthStore.getState().isUnlocked).toBe(false);
    expect(
      renderer!.root.findAll(node => node.props.title === 'Thử lại').length,
    ).toBeGreaterThan(0);
  },
);

test('late OS success after logout cannot unlock another session', async () => {
  let complete!: (success: boolean) => void;
  jest.mocked(authenticateDeviceCredential).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  await mountGate();
  await act(async () => {
    useAuthStore.setState({ token: null, isUnlocked: false, sessionId: 101 });
    complete(true);
  });
  expect(useAuthStore.getState()).toMatchObject({
    token: null,
    isUnlocked: false,
  });
  await act(async () => renderer!.unmount());
  renderer = undefined;
  expect(cancelDeviceCredential).toHaveBeenCalled();
});
