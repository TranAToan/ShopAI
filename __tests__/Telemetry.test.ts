import { getApps } from '@react-native-firebase/app';
import { log, recordError } from '@react-native-firebase/crashlytics';
import { reportFailure, breadcrumb } from '../src/services/telemetry';
jest.mock('../src/constants/env',()=>({APP_ENV:'staging',API_BASE_URL:'http://127.0.0.1:3000',ENABLE_CRASHLYTICS:true}));
beforeEach(()=>{jest.clearAllMocks();jest.mocked(getApps).mockReturnValue([{} as never]);});
test('nonfatal reporting uses only sanitized operation name rather than raw request errors',()=>{
  reportFailure('CheckoutOrderFailed',503);
  expect(recordError).toHaveBeenCalledWith(expect.anything(),expect.objectContaining({message:'CheckoutOrderFailed'}),'CheckoutOrderFailed');
  expect(log).toHaveBeenCalledWith(expect.anything(),'CheckoutOrderFailed: failed');
});
test('missing Firebase app does not break shopping',()=>{
  jest.mocked(getApps).mockReturnValue([]);
  expect(()=>{reportFailure('ProductFetchFailed');breadcrumb('Checkout started');}).not.toThrow();
  expect(recordError).not.toHaveBeenCalled();
});
