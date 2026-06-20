/* eslint-env node */
/**
 * Next Step - Asset Generation Script
 * 
 * This script resizes the main `assets/images/logo.png` into all sizes required
 * for App Store / Google Play Store deployment, including adaptive icons, splash icon, and favicon.
 * 
 * Requirements:
 * - Run `npm install jimp` in the mobile directory before running this script.
 * 
 * Usage:
 * - Run `node generate-assets.js` in the mobile directory.
 */

const fs = require('fs');
const path = require('path');

const run = async () => {
  let Jimp;
  try {
    Jimp = require('jimp');
  } catch (_err) {
    console.error('\x1b[31mError: "jimp" library is not installed.\x1b[0m');
    console.log('Please run the following command first:');
    console.log('\x1b[36mnpm install jimp\x1b[0m');
    process.exit(1);
  }

  const imgDir = path.join(__dirname, 'assets', 'images');
  const logoPath = path.join(imgDir, 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error(`\x1b[31mError: Source logo file not found at: ${logoPath}\x1b[0m`);
    process.exit(1);
  }

  console.log('\x1b[35m[1/7] Reading source logo.png...\x1b[0m');
  const logo = await Jimp.read(logoPath);

  // 1. icon.png (1024x1024)
  console.log('\x1b[35m[2/7] Generating icon.png (1024x1024)...\x1b[0m');
  const icon = logo.clone().resize(1024, 1024);
  await icon.writeAsync(path.join(imgDir, 'icon.png'));

  // 2. splash-icon.png (512x512)
  console.log('\x1b[35m[3/7] Generating splash-icon.png (512x512)...\x1b[0m');
  const splashIcon = logo.clone().resize(512, 512);
  await splashIcon.writeAsync(path.join(imgDir, 'splash-icon.png'));

  // 3. android-icon-foreground.png (1024x1024)
  // Safe zone for adaptive icons is the central 66% (approx 680px) to prevent clipping.
  console.log('\x1b[35m[4/7] Generating android-icon-foreground.png (1024x1024)...\x1b[0m');
  const foreground = new Jimp(1024, 1024, 0x00000000); // transparent background
  const resizedLogo = logo.clone().resize(680, 680);
  foreground.composite(resizedLogo, (1024 - 680) / 2, (1024 - 680) / 2);
  await foreground.writeAsync(path.join(imgDir, 'android-icon-foreground.png'));

  // 4. android-icon-background.png (1024x1024)
  // Background matches the color specified in app.json (#E6F4FE)
  console.log('\x1b[35m[5/7] Generating android-icon-background.png (1024x1024)...\x1b[0m');
  const background = new Jimp(1024, 1024, 0xE6F4FEFF); // Solid color #E6F4FE with full opacity
  await background.writeAsync(path.join(imgDir, 'android-icon-background.png'));

  // 5. android-icon-monochrome.png (1024x1024)
  console.log('\x1b[35m[6/7] Generating android-icon-monochrome.png (1024x1024)...\x1b[0m');
  const monochrome = foreground.clone().grayscale();
  await monochrome.writeAsync(path.join(imgDir, 'android-icon-monochrome.png'));

  // 6. favicon.png (48x48)
  console.log('\x1b[35m[7/7] Generating favicon.png (48x48)...\x1b[0m');
  const favicon = logo.clone().resize(48, 48);
  await favicon.writeAsync(path.join(imgDir, 'favicon.png'));

  console.log('\n\x1b[32m✔ Success! All asset images regenerated and scaled.\x1b[0m');
  console.log('You can now run: \x1b[36mnode inspect-dimensions.js\x1b[0m to verify.');
};

run().catch(err => {
  console.error('\x1b[31mError during asset generation:\x1b[0m', err);
  process.exit(1);
});
