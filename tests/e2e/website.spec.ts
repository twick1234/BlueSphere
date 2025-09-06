import { test, expect } from '@playwright/test';

test('home loads and shows mission tagline', async ({ page }) => {
  await page.goto('http://localhost:4000/');
  await expect(page.locator('text=Turning ocean data into a brighter future.')).toBeVisible();
});

test('impact page navigates', async ({ page }) => {
  await page.goto('http://localhost:4000/impact');
  await expect(page.locator('h1')).toContainText(/Environmental Impact/i);
});
