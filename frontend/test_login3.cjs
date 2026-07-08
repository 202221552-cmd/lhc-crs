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

  console.log('LOGGED IN');

  // Go to backgrounds page - use domcontentloaded to avoid networkidle timeout
  await page.goto('http://localhost:5173/admin-backgrounds', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  console.log('BG PAGE LOADED');

  // Log all buttons
  const btnInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns).map((b, i) => ({
      index: i,
      text: b.textContent.trim().substring(0, 50),
      visible: b.offsetParent !== null,
    }));
  });
  console.log('BUTTONS:', JSON.stringify(btnInfo));

  // Try clicking IMAGE button
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('صورة مرفوعة')) {
        console.log('CLICKING IMAGE BUTTON');
        b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    }
    console.log('IMAGE BUTTON NOT FOUND');
  });
  await page.waitForTimeout(1000);

  const afterImage = await page.evaluate(() => {
    return {
      chooseImageBtn: document.body.textContent.includes('اختيار صورة'),
      chooseFromDevice: document.body.textContent.includes('اختر صورة من جهازك'),
      hasFileInput: document.querySelector('input[type="file"]') !== null,
      previewText: document.querySelector('div[style*="glass-panel"]')?.textContent?.substring(0, 100) || '',
    };
  });
  console.log('AFTER IMAGE CLICK:', JSON.stringify(afterImage));

  // Try clicking VIDEO button
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('فيديو يوتيوب')) {
        console.log('CLICKING VIDEO BUTTON');
        b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    }
  });
  await page.waitForTimeout(1000);

  const afterVideo = await page.evaluate(() => {
    return {
      hasVideoLink: document.body.textContent.includes('رابط فيديو يوتيوب'),
      hasPlaceholder: document.body.textContent.includes('https://www.youtube.com'),
    };
  });
  console.log('AFTER VIDEO CLICK:', JSON.stringify(afterVideo));

  // Log final errors
  const errs = logs.filter(l => l.type === 'error');
  if (errs.length) console.log('ERRORS:', errs.map(e=>e.text));
  else console.log('NO ERRORS');

  await browser.close();
})().catch(err => console.error('PW ERR:', err.message));
