const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dest = path.join(root, '.shopai-backups', `${process.argv[2] || 'snapshot'}-${stamp}`);
const excluded = new Set(['node_modules','.git','.gradle','.cxx','.npm-cache','.shopai-backups','ShopAI1App','react-native-thuc-chien-main','build','dist','coverage','native-elf']);
const manifest = [];
function copy(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (excluded.has(entry.name)) continue;
    const name = path.join(rel,entry.name), source = path.join(dir,entry.name);
    if (entry.isDirectory()) copy(source,name);
    else if (entry.isFile()) {
      const target = path.join(dest,name + '.bak');
      fs.mkdirSync(path.dirname(target),{recursive:true}); fs.copyFileSync(source,target);
      manifest.push({file:name,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
    }
  }
}
copy(root);
fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({backup:dest,files:manifest.length}));
