import { test, expect } from '@playwright/test';

test('verify book page seo sections', async ({ page }) => {
  // Test with a known book ID from history if possible, or search for one
  await page.goto('http://localhost:3000/book/al-aqeedah-al-wasitiyyah--aqidah_wasitiyah');
  await page.waitForTimeout(3000);

  // Check for OCR Preview title
  const previewTitle = await page.textContent('h2:has-text("Preview from the Book"), h2:has-text("مقتطفات من الكتاب")');
  console.log('Preview title found:', previewTitle);

  // Check for Related Topics
  const relatedTopics = await page.locator('h3:has-text("Related Islamic Topics"), h3:has-text("مواضيع إسلامية ذات صلة")');
  await expect(relatedTopics).toBeVisible();

  await page.screenshot({ path: 'seo_verification.png', fullPage: true });
});
