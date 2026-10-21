const base = require('./app.json');
const projectId = process.env.EXPO_PROJECT_ID;
module.exports = {
  name:'ShopAI',slug:'shopai',version:'1.1.0',
  android:{package:'com.shopai1app',versionCode:10100},
  ios:{bundleIdentifier:'com.shopai1app'},
  runtimeVersion:'1.1.0',
  updates:projectId?{enabled:true,url:`https://u.expo.dev/${projectId}`,checkAutomatically:'ON_LOAD',fallbackToCacheTimeout:0}:{enabled:false},
  extra:{...(projectId?{eas:{projectId}}:{}),nativeRegistrationName:base.name},
};
