import { Vibration } from 'react-native';

let hapticsEnabled = true;

export const setHapticsEnabled = (value: boolean) => {
  hapticsEnabled = value;
};

const safeVibrate = (pattern: number | number[]) => {
  if (!hapticsEnabled) return;
  try {
    Vibration.vibrate(pattern);
  } catch {
    // Optional feedback must never interrupt scanning on unsupported devices.
  }
};

export const hapticLight = () => safeVibrate(20);
export const hapticMedium = () => safeVibrate(40);
// One pulse, per Sprint 7 acceptance criteria. iOS uses its fixed system duration.
export const hapticSuccess = () => safeVibrate(40);
export const hapticError = () => safeVibrate([0, 60, 80, 60, 80, 60]);
