import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', err => logs.push({ type: 'error', text: err.message }));

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);

console.log('TITLE:', await page.title());

const errors = logs.filter(l => l.type === 'error');
if (errors.length) {
  console.log('ERRORS:', errors.map(e => e.text).join(' | '));
}

const selector = 'div[style*="cursor: pointer"]';
const portalCards = await page.$$(selector);
console.log('CARDS:', portalCards.length);

if (portalCards.length > 0) {
  await portalCards[0].click();
  await page.waitForTimeout(2000);

  const txt = await page.textContent('body');
  if (txt.includes('LoginForm')) {
    console.log('BANNER: YES');
  } else {
    console.log('BANNER: NO - snippet:', txt.substring(0, 200).replace(/\n/g, ' '));
  }
}

await browser.close();
