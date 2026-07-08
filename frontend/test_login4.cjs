const { chromium } = require('/Users/mosanazmi/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await (await page.$$('div[style*="cursor: pointer"]'))[0].click();
  await page.waitForTimeout(1500);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('102030.55');
  await (await page.$('button[type="submit"]')).click();
  await page.waitForTimeout(3000);

  console.log('=== LOGGED IN');

  // Go to backgrounds page
  await page.goto('http://localhost:5173/admin-backgrounds', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('=== BG PAGE LOADED');

  // Clear logs
  logs.length = 0;

  // Playwright native click on IMAGE button
  const imgBtn = await page.locator('button:has-text("صورة مرفوعة")');
  console.log('=== IMAGE BTN EXISTS:', await imgBtn.count() > 0);
  await imgBtn.click();
  await page.waitForTimeout(1500);

  // Log console messages from the click
  console.log('=== CONSOLE AFTER IMAGE CLICK:');
  logs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  // Check if content changed
  const hasImgContent = await page.evaluate(() => document.body.textContent.includes('اختيار صورة'));
  console.log('=== IMAGE CONTENT VISIBLE:', hasImgContent);

  // Now click VIDEO
  logs.length = 0;
  const vidBtn = await page.locator('button:has-text("فيديو يوتيوب")');
  console.log('=== VIDEO BTN EXISTS:', await vidBtn.count() > 0);
  await vidBtn.click();
  await page.waitForTimeout(1500);

  console.log('=== CONSOLE AFTER VIDEO CLICK:');
  logs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  const hasVidContent = await page.evaluate(() => document.body.textContent.includes('رابط فيديو يوتيوب'));
  console.log('=== VIDEO CONTENT VISIBLE:', hasVidContent);

  // Click portal tab EMPLOYEE
  logs.length = 0;
  const empTab = await page.locator('button:has-text("بوابة الموظفين")');
  console.log('=== EMPLOYEE TAB EXISTS:', await empTab.count() > 0);
  await empTab.click();
  await page.waitForTimeout(3000);

  console.log('=== CONSOLE AFTER TAB CLICK:');
  logs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

  const pageUrl = page.url();
  console.log('=== URL:', pageUrl);
  console.log('=== EXPECTED: admin-backgrounds?portal=EMPLOYEE');

  await browser.close();
})().catch(err => console.error('PW ERR:', err.message));
