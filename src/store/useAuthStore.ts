import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'SHOP_ACCESS_TOKEN';
const storageOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
type AuthState = {
  token: string | null;
  isLoading: boolean;
  isUnlocked: boolean;
  sessionId: number;
  lockEpoch: number;
  authError: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkLocalToken: () => Promise<void>;
  setIsUnlocked: (
    value: boolean,
    sessionId?: number,
    lockEpoch?: number,
  ) => void;
};
// A late login write cannot restore a logged-out token.
let storageQueue: Promise<unknown> = Promise.resolve();
let restoreRequest: Promise<void> | null = null;
let restored = false;
function withStorage<T>(operation: () => Promise<T>): Promise<T> {
  const request = storageQueue.then(operation);
  storageQueue = request.catch(() => undefined);
  return request;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  isUnlocked: false,
  sessionId: 0,
  lockEpoch: 0,
  authError: null,
  login: async newToken => {
    const token = newToken.trim();
    if (!token) {
      throw new Error('Không nhận được phiên đăng nhập hợp lệ.');
    }
    const sessionId = get().sessionId + 1;
    set({
      sessionId,
      token: null,
      isUnlocked: false,
      isLoading: true,
      authError: null,
    });
    try {
      await withStorage(() =>
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, storageOptions),
      );
      if (get().sessionId === sessionId) {
        set({ token, isUnlocked: false, isLoading: false });
      }
    } catch {
      if (get().sessionId === sessionId) {
        set({ token: null, isUnlocked: false, isLoading: false });
      }
      throw new Error(
        'Không lưu được phiên đăng nhập an toàn. Bạn thử lại nhé.',
      );
    }
  },
  logout: async () => {
    const sessionId = get().sessionId + 1;
    set({
      sessionId,
      token: null,
      isUnlocked: false,
      isLoading: false,
      authError: null,
    });
    try {
      await withStorage(() =>
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, storageOptions),
      );
    } catch {
      const message =
        'Chưa xóa được phiên đã lưu trên thiết bị. Bạn thử đăng xuất lại trước khi đóng ứng dụng.';
      if (get().sessionId === sessionId) {
        set({ authError: message });
      }
      throw new Error(message);
    }
  },
  checkLocalToken: () => {
    if (restored) {
      return Promise.resolve();
    }
    if (restoreRequest) {
      return restoreRequest;
    }
    const sessionId = get().sessionId;
    set({ isLoading: true });
    restoreRequest = (async () => {
      try {
        const storedToken = await withStorage(() =>
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY, storageOptions),
        );
        if (get().sessionId === sessionId) {
          set({
            token: storedToken?.trim() || null,
            isUnlocked: false,
            authError: null,
          });
        }
      } catch {
        if (get().sessionId === sessionId) {
          set({
            token: null,
            isUnlocked: false,
            authError: 'Không đọc được phiên đã lưu. Bạn đăng nhập lại nhé.',
          });
        }
      } finally {
        restored = true;
        restoreRequest = null;
        if (get().sessionId === sessionId) {
          set({ isLoading: false });
        }
      }
    })();
    return restoreRequest;
  },
  setIsUnlocked: (value, sessionId, lockEpoch) => {
    const state = get();
    if (
      !state.token ||
      (sessionId !== undefined && state.sessionId !== sessionId) ||
      (lockEpoch !== undefined && state.lockEpoch !== lockEpoch)
    ) {
      return;
    }
    set({
      isUnlocked: value,
      lockEpoch: value ? state.lockEpoch : state.lockEpoch + 1,
    });
  },
}));

export async function logoutSafely(): Promise<void> {
  try {
    await useAuthStore.getState().logout();
  } catch {
    /* Login displays the storage deletion failure; never log secrets. */
  }
}
