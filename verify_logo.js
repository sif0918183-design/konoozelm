const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to a common desktop size
  await page.setViewportSize({ width: 1280, height: 1000 });

  // Arabic Home
  await page.goto('http://localhost:3005/');
  await page.waitForTimeout(2000); // Wait for fonts/images
  await page.screenshot({ path: 'home_ar.png' });
  console.log('Arabic home screenshot saved.');

  // English Home
  await page.goto('http://localhost:3005/en');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'home_en.png' });
  console.log('English home screenshot saved.');

  await browser.close();
})();
