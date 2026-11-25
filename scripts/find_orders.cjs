const fs = require('fs');
const content = fs.readFileSync('android-app/app/src/main/assets/www/index.html', 'utf8');
const idx = content.indexOf('ordersView');
console.log('Index of ordersView:', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 40, idx + 100));
}

