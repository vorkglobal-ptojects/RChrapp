import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.join('fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontFiles = [
  {
    name: 'AbhayaLibre-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/abhayalibre/v1/zTLc5Jxv6yvb1nHyqBasVy3USBnSvpkopQaUR-2r7iU.ttf'
  },
  {
    name: 'AbhayaLibre-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/abhayalibre/v1/wBjdF6T34NCo7wQYXgzrc0D2ttfZwueP-QU272T9-k4.ttf'
  }
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: status code ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🔄 Starting font downloads for Abhaya Libre...');
  for (const font of fontFiles) {
    const destPath = path.join(fontsDir, font.name);
    console.log(`📥 Downloading ${font.name}...`);
    try {
      await downloadFile(font.url, destPath);
      console.log(`✅ Downloaded ${font.name} to ${destPath}`);
    } catch (err: any) {
      console.error(`❌ Failed to download ${font.name}:`, err.message);
    }
  }
  console.log('🎉 Font download complete!');
}

run().catch(console.error);
