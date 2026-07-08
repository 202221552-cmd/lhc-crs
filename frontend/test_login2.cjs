const { chromium } = require('/Users/mosanazmi/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const cards = await page.$$('div[style*="cursor: pointer"]');
  await cards[0].click();
  await page.waitForTimeout(1500);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('102030.55');
  await (await page.$('button[type="submit"]')).click();
  await page.waitForTimeout(3000);
  console.log('LOGGED IN:', page.url());

  // Go to backgrounds page
  await page.goto('http://localhost:5173/admin-backgrounds', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('BG PAGE URL:', page.url());
  
  const errors1 = logs.filter(l => l.type === 'error');
  if (errors1.length) console.log('ERRORS:', errors1.map(e=>e.text).join(' | '));
  
  // Check page content
  const txt = await page.textContent('body');
  console.log('PAGE SNIPPET:', txt.substring(0, 400).replace(/\n/g, ' '));
  
  // Check if loading is done
  if (txt.includes('جاري التحميل')) {
    console.log('STILL LOADING after 3s');
  } else {
    console.log('PAGE LOADED');
  }

  // Check for "ليس لديك صلاحية"
  if (txt.includes('صلاحية')) {
    console.log('PERMISSION DENIED');
  }

  // Try clicking buttons
  const btns = await page.$$('button');
  console.log('BUTTONS:', btns.length);
  for (const btn of btns) {
    const t = (await btn.textContent()).trim();
    console.log('  BTN:', t.substring(0, 50));
  }

  // Try clicking IMAGE
  const imageBtn = await page.$('button:has-text("صورة")');
  if (imageBtn) {
    console.log('CLICKING IMAGE...');
    await imageBtn.click();
    await page.waitForTimeout(500);
    console.log('AFTER IMAGE CLICK');
    const txt2 = await page.textContent('body');
    if (txt2.includes('اختيار صورة')) console.log('IMAGE OPTION SHOWING');
    else console.log('IMAGE NOT CHANGED');
  }

  // Try clicking VIDEO
  const videoBtn = await page.$('button:has-text("فيديو")');
  if (videoBtn) {
    console.log('CLICKING VIDEO...');
    await videoBtn.click();
    await page.waitForTimeout(500);
    const txt3 = await page.textContent('body');
    if (txt3.includes('رابط فيديو')) console.log('VIDEO OPTION SHOWING');
    else console.log('VIDEO NOT CHANGED');
  }

  console.log('FINAL ERRORS:', logs.filter(l=>l.type==='error').map(e=>e.text).join(' | '));

  await browser.close();
})().catch(err => console.error('PW ERR:', err.message));
