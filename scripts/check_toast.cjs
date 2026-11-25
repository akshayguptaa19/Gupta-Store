const fs = require('fs');
const content = fs.readFileSync('android-app/app/src/main/assets/www/index.html', 'utf8');
const idx = content.indexOf('toastMsg');
console.log('Index:', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 60, idx + 60));
}

