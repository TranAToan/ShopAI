import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@contexts/ThemeContext';
import AppNavigator from '@navigation/AppNavigator';
import { reduxStore } from '@store/redux/store';
import { useAuthStore } from '@store/useAuthStore';
import { useAppLock } from '@hooks/useAppLock';
import PinGateScreen from '@screens/PinGateScreen';
import './src/locales/i18n';
import { initializeTelemetry } from '@services/telemetry';
import { checkForAppUpdate } from '@services/ota';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

function AuthContent(): React.JSX.Element {
  const token = useAuthStore(state => state.token);
  const isLoading = useAuthStore(state => state.isLoading);
  const isUnlocked = useAuthStore(state => state.isUnlocked);
  const sessionId = useAuthStore(state => state.sessionId);
  const lockEpoch = useAuthStore(state => state.lockEpoch);
  const checkLocalToken = useAuthStore(state => state.checkLocalToken);
  useAppLock();
  useEffect(() => {
    void checkLocalToken();
  }, [checkLocalToken]);
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.sessionId !== previous.sessionId) queryClient.clear();
      }),
    [],
  );
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF4D4F" />
      </View>
    );
  }
  if (token && !isUnlocked) {
    return <PinGateScreen key={`${sessionId}-${lockEpoch}`} />;
  }
  return <AppNavigator key={sessionId} />;
}

function App(): React.JSX.Element {
  useEffect(() => {
    initializeTelemetry();
    void checkForAppUpdate();
  }, []);
  return (
    <SafeAreaProvider>
      <ReduxProvider store={reduxStore}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthContent />
          </ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
