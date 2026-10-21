import type { useAuthStore as AuthStore } from '../src/store/useAuthStore';
import type * as SecureStore from 'expo-secure-store';

let store: typeof AuthStore;
let storage: typeof SecureStore;
beforeEach(() => {
  jest.resetModules();
  storage = require('expo-secure-store');
  store = require('../src/store/useAuthStore').useAuthStore;
});

test('login saves the session but still requires the app PIN', async () => {
  let complete!: () => void;
  jest.mocked(storage.setItemAsync).mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        complete = resolve;
      }),
  );
  const login = store.getState().login('test-session');
  await Promise.resolve();
  expect(store.getState()).toMatchObject({ token: null, isUnlocked: false });
  complete();
  await login;
  expect(store.getState()).toMatchObject({
    token: 'test-session',
    isUnlocked: false,
    isLoading: false,
  });
  expect(storage.setItemAsync).toHaveBeenCalledWith(
    'SHOP_ACCESS_TOKEN',
    'test-session',
    expect.any(Object),
  );
});

test('failed secure write never creates an authenticated session', async () => {
  jest
    .mocked(storage.setItemAsync)
    .mockRejectedValueOnce(new Error('native failure'));
  await expect(store.getState().login('test-session')).rejects.toThrow(
    'Không lưu',
  );
  expect(store.getState()).toMatchObject({
    token: null,
    isUnlocked: false,
    isLoading: false,
  });
});

test('restore retains the token but starts locked and does not read twice', async () => {
  jest.mocked(storage.getItemAsync).mockResolvedValueOnce('saved-session');
  await Promise.all([
    store.getState().checkLocalToken(),
    store.getState().checkLocalToken(),
  ]);
  expect(storage.getItemAsync).toHaveBeenCalledTimes(1);
  expect(store.getState()).toMatchObject({
    token: 'saved-session',
    isUnlocked: false,
    isLoading: false,
  });
});

test('restore failure ends loading and returns to login', async () => {
  jest
    .mocked(storage.getItemAsync)
    .mockRejectedValueOnce(new Error('native failure'));
  await store.getState().checkLocalToken();
  expect(store.getState()).toMatchObject({
    token: null,
    isUnlocked: false,
    isLoading: false,
  });
  expect(store.getState().authError).toBeTruthy();
});

test('logout clears memory immediately and deletes the secure token', async () => {
  await store.getState().login('test-session');
  const logout = store.getState().logout();
  expect(store.getState()).toMatchObject({ token: null, isUnlocked: false });
  await logout;
  expect(storage.deleteItemAsync).toHaveBeenCalledWith(
    'SHOP_ACCESS_TOKEN',
    expect.any(Object),
  );
  expect(await storage.getItemAsync('SHOP_ACCESS_TOKEN')).toBeNull();
});

test('delete failure is visible and does not claim persisted logout success', async () => {
  await store.getState().login('test-session');
  jest
    .mocked(storage.deleteItemAsync)
    .mockRejectedValueOnce(new Error('native failure'));
  await expect(store.getState().logout()).rejects.toThrow('Chưa xóa');
  expect(store.getState()).toMatchObject({ token: null, isUnlocked: false });
  expect(store.getState().authError).toContain('Chưa xóa');
  expect(await storage.getItemAsync('SHOP_ACCESS_TOKEN')).toBe('test-session');
});

test('logout during login cannot resurrect memory or leave the late token in secure storage', async () => {
  let complete!: () => void;
  jest.mocked(storage.setItemAsync).mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        complete = resolve;
      }),
  );
  const login = store.getState().login('old-session');
  await Promise.resolve();
  const logout = store.getState().logout();
  complete();
  await Promise.all([login, logout]);
  expect(store.getState()).toMatchObject({ token: null, isUnlocked: false });
  expect(storage.deleteItemAsync).toHaveBeenCalledTimes(1);
});

test('late unlock for an old session or lock epoch is rejected', async () => {
  await store.getState().login('old-session');
  const old = store.getState();
  await store.getState().logout();
  await store.getState().login('new-session');
  store.getState().setIsUnlocked(false);
  store.getState().setIsUnlocked(true, old.sessionId, old.lockEpoch);
  expect(store.getState().isUnlocked).toBe(false);
  const epoch = store.getState().lockEpoch;
  store.getState().setIsUnlocked(false);
  store.getState().setIsUnlocked(true, store.getState().sessionId, epoch);
  expect(store.getState().isUnlocked).toBe(false);
});

test('late restore cannot overwrite a new login', async () => {
  let complete!: (value: string) => void;
  jest.mocked(storage.getItemAsync).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  const restoring = store.getState().checkLocalToken();
  await Promise.resolve();
  const login = store.getState().login('new-session');
  complete('old-session');
  await Promise.all([restoring, login]);
  expect(store.getState()).toMatchObject({
    token: 'new-session',
    isUnlocked: false,
    isLoading: false,
  });
});
