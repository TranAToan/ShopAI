import * as Updates from 'expo-updates';
import { checkForAppUpdate } from '../src/services/ota';
import { reportFailure } from '../src/services/telemetry';
jest.mock('expo-updates',()=>({__esModule:true,isEnabled:true,checkForUpdateAsync:jest.fn(),fetchUpdateAsync:jest.fn()}));
jest.mock('../src/constants/env',()=>({ENABLE_OTA_UPDATE:true}));
jest.mock('../src/services/telemetry',()=>({breadcrumb:jest.fn(),reportFailure:jest.fn()}));
const originalDev=__DEV__;
const runtime=globalThis as typeof globalThis & {__DEV__:boolean};
beforeEach(()=>{jest.clearAllMocks();runtime.__DEV__=false;Object.assign(Updates,{isEnabled:true});});
afterEach(()=>{runtime.__DEV__=originalDev;});
test('downloads compatible OTA without reloading checkout or PIN',async()=>{
  jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({isAvailable:true} as never);
  jest.mocked(Updates.fetchUpdateAsync).mockResolvedValue({} as never);
  await checkForAppUpdate();
  expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  expect(reportFailure).not.toHaveBeenCalled();
});
test('OTA failure is nonfatal and reported without raw provider data',async()=>{
  jest.mocked(Updates.checkForUpdateAsync).mockRejectedValue(new Error('sensitive request details'));
  await expect(checkForAppUpdate()).resolves.toBeUndefined();
  expect(reportFailure).toHaveBeenCalledWith('OtaUpdateFailed');
});
test('disabled native updates do not contact update service',async()=>{
  Object.assign(Updates,{isEnabled:false});
  await checkForAppUpdate();
  expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
});
