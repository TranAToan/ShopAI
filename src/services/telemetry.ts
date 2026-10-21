import { getApps } from '@react-native-firebase/app';
import {
  getCrashlytics,
  log,
  recordError,
  setAttributes,
  setCrashlyticsCollectionEnabled,
  crash,
} from '@react-native-firebase/crashlytics';
import { APP_ENV, API_BASE_URL, ENABLE_CRASHLYTICS } from '@constants/env';
// Never send AxiosError/config/body/headers, user text, PIN, tokens or keys.
function instance() {
  try {
    return getApps().length ? getCrashlytics() : null;
  } catch {
    return null;
  }
}
export function initializeTelemetry() {
  const target = instance();
  if (!target) return;
  void setCrashlyticsCollectionEnabled(target, ENABLE_CRASHLYTICS).catch(
    () => undefined,
  );
  void setAttributes(target, {
    app_env: APP_ENV,
    api_base_url: API_BASE_URL,
  }).catch(() => undefined);
  log(target, 'ShopAI started');
}
export function breadcrumb(
  event: string,
  attributes: Record<string, string> = {},
) {
  if (!ENABLE_CRASHLYTICS) return;
  const target = instance();
  if (!target) return;
  try {
    log(target, event);
    void setAttributes(target, attributes).catch(() => undefined);
  } catch {
    /* Monitoring must not break shopping. */
  }
}
export function reportFailure(
  name: 'ProductFetchFailed' | 'CheckoutOrderFailed' | 'OtaUpdateFailed',
  status?: number,
) {
  if (!ENABLE_CRASHLYTICS) return;
  const target = instance();
  if (!target) return;
  try {
    log(target, `${name}: failed`);
    void setAttributes(target, {
      operation: name,
      http_status: status === undefined ? 'unknown' : String(status),
    }).catch(() => undefined);
    recordError(target, new Error(name), name);
  } catch {
    /* No secrets or raw error objects in telemetry. */
  }
}
export async function testCrashInDevelopment() {
  if (!__DEV__) return;
  const target = instance();
  if (!target) return;
  await setCrashlyticsCollectionEnabled(target, true);
  log(target, 'Intentional development-only test crash');
  crash(target);
}
