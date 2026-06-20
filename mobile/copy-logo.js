const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'assets', 'images', 'logo.png');
const dest = 'C:/Users/somes/.gemini/antigravity-ide/brain/24338f2c-4aa2-4d61-8608-0ed093eeaae2/logo.png';

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('Logo successfully copied to artifact directory!');
} catch (err) {
  console.error('Error copying logo:', err);
}
