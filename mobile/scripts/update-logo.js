const fs = require('fs');
const path = require('path');

const src = 'C:/Users/somes/.gemini/antigravity-ide/brain/b1fbe42b-bf07-46f4-a8eb-be17b8de4180/next_step_logo_1781961818904.png';
const dest = path.join(__dirname, '..', 'assets', 'images', 'logo.png');

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('\x1b[32m✔ Premium logo successfully copied to assets/images/logo.png!\x1b[0m');
} catch (err) {
  console.error('\x1b[31mError copying premium logo:\x1b[0m', err);
}
