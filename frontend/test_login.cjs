const { chromium } = require('/Users/mosanazmi/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

  // Visit login page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/login_1_portal_selector.png', fullPage: true });
  console.log('1. PortalSelector screenshot saved');

  // Click first portal card (ADMIN)
  const selector = 'div[style*="cursor: pointer"]';
  const portalCards = await page.$$(selector);
  await portalCards[0].click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/login_2_admin_form.png', fullPage: true });
  console.log('2. LoginForm screenshot saved');

  const txt = await page.textContent('body');
  console.log('3. Banner:', txt.includes('LoginForm') ? 'YES' : 'NO');
  console.log('4. Body snippet:', txt.substring(0, 200).replace(/\n/g, ' '));

  // Check gradient in computed style
  const gradient = await page.evaluate(() => {
    const outer = document.body.querySelector('div');
    if (!outer) return 'NO DIV';
    const bg = window.getComputedStyle(outer).background;
    return bg;
  });
  console.log('5. Body background:', gradient);

  // Check bg error
  if (txt.includes('BG Error')) {
    const errMatch = txt.match(/BG Error: ([^\n]*)/);
    console.log('6. BG Error:', errMatch ? errMatch[1] : 'found but no match');
  }

  // Click "العودة" button to go back
  const backBtn = await page.$('button');
  if (backBtn) {
    const backText = await backBtn.textContent();
    console.log('7. Back button text:', backText.trim());
    if (backText.includes('العودة')) {
      await backBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/login_3_back.png', fullPage: true });
      console.log('8. Back to selector screenshot saved');
    }
  }

  // Now test AdminBackgroundsPage - login first
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Click ADMIN portal
  const cards = await page.$$(selector);
  await cards[0].click();
  await page.waitForTimeout(2000);

  // Fill login form and submit
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].fill('admin');
    await inputs[1].fill('102030.55');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('9. Logged in. URL:', page.url());
      await page.screenshot({ path: '/tmp/login_4_logged_in.png', fullPage: true });
    }
  }

  // Navigate to AdminBackgroundsPage
  await page.goto('http://localhost:5173/admin-backgrounds', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/login_5_bg_page.png', fullPage: true });
  console.log('10. AdminBackgroundsPage screenshot saved');
  console.log('11. Bg page URL:', page.url());

  const bgText = await page.textContent('body');
  console.log('12. Bg page text:', bgText.substring(0, 300).replace(/\n/g, ' '));

  // Try clicking IMAGE option
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const t = await btn.textContent();
    if (t.includes('صورة مرفوعة')) {
      console.log('13. Found IMAGE button:', t.trim());
      await btn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/login_6_image_clicked.png', fullPage: true });
      console.log('14. After clicking IMAGE option');
      break;
    }
  }

  await browser.close();
})().catch(err => console.error('PW ERR:', err.message));
