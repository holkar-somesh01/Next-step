const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'assets', 'images');
const files = fs.readdirSync(imgDir);

console.log('--- NEXT STEP IMAGE ASSETS INSPECTION ---');
console.log('Checking files in:', imgDir);

files.forEach(file => {
  if (file.endsWith('.png')) {
    const filePath = path.join(imgDir, file);
    const stats = fs.statSync(filePath);
    let dimensions = 'Unknown';
    try {
      const buffer = Buffer.alloc(24);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 24, 0);
      fs.closeSync(fd);
      
      if (buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(12) === 0x49484452) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        dimensions = `${width}x${height}`;
      }
    } catch (e) {
      dimensions = `Error: ${e.message}`;
    }
    console.log(`- ${file}: ${dimensions} (${(stats.size/1024).toFixed(2)} KB)`);
  }
});
