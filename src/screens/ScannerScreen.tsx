import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import ShopButton from '@components/ShopButton';
import Typography from '@components/ui/Typography';
import { useTheme } from '@contexts/ThemeContext';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import { hapticSuccess } from '@utils/haptics';

type Props = NativeStackScreenProps<HomeStackParamList, 'Scanner'>;
type PermissionState = 'checking' | 'granted' | 'denied';

export default function ScannerScreen({
  navigation,
}: Props): React.JSX.Element {
  const { colors } = useTheme();
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  const isScanning = useRef(false);
  const mounted = useRef(false);
  const requesting = useRef(false);

  const checkPermission = useCallback(async (request: boolean) => {
    if (requesting.current) return;
    requesting.current = true;
    try {
      let status = Camera.getCameraPermissionStatus();
      if (request && status !== 'granted' && status !== 'restricted') {
        status = await Camera.requestCameraPermission();
      }
      if (mounted.current) {
        setPermission(status === 'granted' ? 'granted' : 'denied');
        setError(null);
      }
    } catch {
      if (mounted.current) {
        setPermission('denied');
        setError('Không kiểm tra được quyền Camera. Vui lòng thử lại.');
      }
    } finally {
      requesting.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void checkPermission(true);
    const sub = AppState.addEventListener('change', next => {
      setAppState(next);
      // Returning from Settings should check permission, not show another prompt.
      if (next === 'active') void checkPermission(false);
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [checkPermission]);

  useFocusEffect(
    useCallback(() => {
      isScanning.current = false;
      void checkPermission(false);
      return () => {
        isScanning.current = true;
      };
    }, [checkPermission]),
  );

  const goBack = () => {
    isScanning.current = true;
    navigation.goBack();
  };

  const openAppSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        'Không mở được Cài đặt',
        'Hãy mở Cài đặt > Ứng dụng > ShopAI1App > Quyền > Camera.',
      );
    });
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128'],
    onCodeScanned: codes => {
      if (
        isScanning.current ||
        !navigation.isFocused() ||
        AppState.currentState !== 'active' ||
        permission !== 'granted'
      )
        return;
      const value = codes.find(code => code.value)?.value;
      if (!value) return;
      isScanning.current = true;
      hapticSuccess();
      // Navigation 7: pop the scanner rather than push a second Home screen.
      navigation.popTo('Home', { scannedCode: value });
    },
  });

  if (permission !== 'granted' || !device || error) {
    const checking = permission === 'checking';
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <Typography
          variant="h2"
          color={error || permission === 'denied' ? colors.error : colors.text}
          style={styles.message}
        >
          {checking
            ? 'Đang kiểm tra quyền Camera...'
            : error ??
              (permission === 'denied'
                ? 'Chưa có quyền Camera'
                : 'Không tìm thấy Camera sau')}
        </Typography>
        {!checking && (
          <>
            <Typography variant="body2" style={styles.message}>
              {permission === 'denied'
                ? 'ShopAI cần Camera để quét mã vạch và QR. Hình ảnh được xử lý trên thiết bị. Bạn có thể cấp quyền trong Cài đặt.'
                : 'Camera chưa sẵn sàng. Hãy thử lại hoặc dùng điện thoại thật để quét mã.'}
            </Typography>
            {permission === 'denied' && (
              <ShopButton
                title="Mở Cài đặt"
                onPress={openAppSettings}
                style={styles.button}
              />
            )}
            <ShopButton
              title="Thử lại"
              variant="outline"
              onPress={() => {
                isScanning.current = false;
                setError(null);
                void checkPermission(true);
              }}
              style={styles.button}
            />
          </>
        )}
        <ShopButton
          title="Quay lại"
          variant="secondary"
          onPress={goBack}
          style={styles.button}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && appState === 'active'}
        codeScanner={codeScanner}
        onError={() => {
          isScanning.current = true;
          setError('Không mở được Camera. Vui lòng thử lại.');
        }}
      />
      <View style={styles.frameWrapper} pointerEvents="none">
        <View style={styles.frame} />
      </View>
      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        <Typography color="#FFFFFF" style={styles.instruction}>
          Đưa mã vạch hoặc QR vào khung hình
        </Typography>
        <ShopButton title="Hủy bỏ" onPress={goBack} style={styles.button} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: { textAlign: 'center', marginBottom: 20 },
  button: { minWidth: 180, marginBottom: 12 },
  frameWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  instruction: {
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
