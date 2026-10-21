import * as Updates from 'expo-updates';
import { ENABLE_OTA_UPDATE } from '@constants/env';
import { breadcrumb, reportFailure } from './telemetry';
export async function checkForAppUpdate() {
  if (__DEV__ || !ENABLE_OTA_UPDATE || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      // Apply on next cold start; never reload during checkout/PIN/chat.
      breadcrumb('Compatible OTA downloaded for next launch');
    }
  } catch {
    reportFailure('OtaUpdateFailed');
  }
}
