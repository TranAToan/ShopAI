const fs=require('fs');
const crypto=require('crypto');
const {spawnSync}=require('child_process');
fs.mkdirSync('secrets/backup',{recursive:true});
if(fs.existsSync('secrets/shopai-release.p12')) { console.log('Existing release key preserved.');process.exit(0); }
const password=crypto.randomBytes(36).toString('base64url');
const result=spawnSync('keytool.exe',['-genkeypair','-storetype','PKCS12','-keystore','secrets/shopai-release.p12','-alias','shopai-release','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=ShopAI,OU=Mobile,O=ShopAI,L=Ho Chi Minh,ST=Ho Chi Minh,C=VN','-storepass:env','SHOP_KEY_PASSWORD','-keypass:env','SHOP_KEY_PASSWORD'],{env:{...process.env,SHOP_KEY_PASSWORD:password},encoding:'utf8'});
if(result.status!==0) { console.error('Could not generate release keystore.');process.exit(1); }
fs.writeFileSync('secrets/signing.properties',`storePassword=${password}\nkeyPassword=${password}\n`);
fs.copyFileSync('secrets/shopai-release.p12','secrets/backup/shopai-release.p12');
fs.copyFileSync('secrets/signing.properties','secrets/backup/signing.properties');
console.log('Production signing key generated, backed up locally; passwords not printed. Keep an external encrypted backup.');
