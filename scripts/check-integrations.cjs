const fs=require('fs');
const file='android/app/google-services.json';
let firebase={present:false,packageMatches:false};
if(fs.existsSync(file)) {
  const json=JSON.parse(fs.readFileSync(file));
  firebase={present:true,packageMatches:json.client?.some(c=>c.client_info?.android_client_info?.package_name==='com.shopai1app')===true};
}
const projectId=process.env.EXPO_PROJECT_ID;
console.log(JSON.stringify({firebase,expoProjectConfigured:!!projectId,expectedAndroidPackage:'com.shopai1app',liveVerification:'Not performed by this configuration check'},null,2));
