import puppeteer from 'puppeteer';
import path from 'path';

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

  console.log('Logging in...');
  // Find email and password inputs
  await page.type('input[type="email"]', 'a.v.chamika.sonali@hrpulse.com');
  await page.type('input[type="password"]', 'chamika123');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);

  console.log('Navigating to Attendance page...');
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle0' });

  // Wait for the Requests tab to appear and click it
  console.log('Switching to Requests tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const requestsBtn = buttons.find(b => b.textContent?.includes('Requests'));
    if (requestsBtn) requestsBtn.click();
  });
  
  // Wait a moment for transition
  await new Promise(r => setTimeout(r, 1000));

  const dashPath = path.join(process.cwd(), 'dashboard_screenshot.png');
  await page.screenshot({ path: dashPath });
  console.log('Saved dashboard_screenshot.png');

  console.log('Opening New Request modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const newReqBtn = buttons.find(b => b.textContent?.includes('New Request'));
    if (newReqBtn) newReqBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  const modalPath = path.join(process.cwd(), 'modal_screenshot.png');
  await page.screenshot({ path: modalPath });
  console.log('Saved modal_screenshot.png');

  await browser.close();
  console.log('Done!');
}

capture().catch(console.error);
