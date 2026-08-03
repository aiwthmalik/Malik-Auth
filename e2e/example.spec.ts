import { test, expect } from '@playwright/test';

test('should load the landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MalikAuth/);
});

test('should have the main heading', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});
