import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';

export type Coords = { latitude: number; longitude: number };
type LocationState = {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
  blocked: boolean;
};

export const useCurrentLocation = () => {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: true,
    error: null,
    blocked: false,
  });
  const mounted = useRef(false);
  const requestId = useRef(0);
  const busy = useRef(false);
  const returningFromSettings = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    const id = ++requestId.current;
    const isCurrent = () => mounted.current && id === requestId.current;
    const finish = (result: Omit<LocationState, 'loading'>) => {
      if (!isCurrent()) return;
      ++requestId.current; // Ignore late native callbacks after completion/timeout.
      busy.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setState({ ...result, loading: false });
    };
    const fail = (error: string, blocked = false) =>
      finish({ coords: null, error, blocked });
    setState({ coords: null, loading: true, error: null, blocked: false });
    // Also bound permission/native failures which never invoke a callback.
    timer.current = setTimeout(
      () => fail('Quá thời gian chờ vị trí. Vui lòng thử lại.'),
      30000,
    );

    try {
      // Lazy loading lets a missing native GPS module fall back without crashing Home.
      const Geolocation: typeof import('@react-native-community/geolocation').default =
        require('@react-native-community/geolocation').default;
      Geolocation.setRNConfiguration({
        skipPermissionRequests: true,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: false,
        locationProvider: 'auto',
      });

      if (Platform.OS === 'android') {
        const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
        const alreadyGranted =
          (await PermissionsAndroid.check(coarse)) ||
          (await PermissionsAndroid.check(fine));
        if (!isCurrent()) return;
        if (!alreadyGranted) {
          // Android 12+ requires requesting both, and approximate location is valid.
          const results = await PermissionsAndroid.requestMultiple([
            fine,
            coarse,
          ]);
          if (!isCurrent()) return;
          if (
            results[fine] !== PermissionsAndroid.RESULTS.GRANTED &&
            results[coarse] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            fail(
              'Chưa được cấp quyền vị trí',
              results[coarse] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
            );
            return;
          }
        }
      } else if (Platform.OS === 'ios') {
        const authorized = await new Promise<boolean>(resolve => {
          Geolocation.requestAuthorization(
            () => resolve(true),
            () => resolve(false),
          );
        });
        if (!isCurrent()) return;
        if (!authorized) {
          fail('Chưa được cấp quyền vị trí', true);
          return;
        }
      }

      if (!isCurrent()) return;
      await Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
          ) {
            fail('Thiết bị trả về vị trí không hợp lệ');
            return;
          }
          finish({
            coords: { latitude, longitude },
            error: null,
            blocked: false,
          });
        },
        error => {
          const messages: Record<number, string> = {
            1: 'Bạn đã từ chối quyền vị trí',
            2: 'Không bắt được tín hiệu GPS. Hãy kiểm tra dịch vụ vị trí.',
            3: 'Quá thời gian chờ GPS. Vui lòng thử lại.',
          };
          fail(
            messages[error.code] ?? 'Không lấy được vị trí',
            error.code === 1,
          );
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
      );
    } catch {
      fail('Không lấy được vị trí. Vui lòng thử lại.');
    }
  }, []);

  const openSettings = useCallback(() => {
    returningFromSettings.current = true;
    Linking.openSettings().catch(() => {
      returningFromSettings.current = false;
      Alert.alert(
        'Không mở được Cài đặt',
        'Hãy mở Cài đặt > Ứng dụng > ShopAI1App > Quyền > Vị trí.',
      );
    });
  }, []);

  useEffect(() => {
    const requestGeneration = requestId;
    mounted.current = true;
    void refresh();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active' && returningFromSettings.current) {
        returningFromSettings.current = false;
        void refresh();
      }
    });
    return () => {
      mounted.current = false;
      ++requestGeneration.current;
      busy.current = false;
      if (timer.current) clearTimeout(timer.current);
      sub.remove();
    };
  }, [refresh]);

  return { ...state, refresh, openSettings };
};
