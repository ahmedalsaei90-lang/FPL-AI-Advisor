import { test, expect } from '@playwright/test';

test.describe('Application smoke checks', () => {
  test('landing page renders primary call to action', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /dominate your/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /try as guest/i })).toBeVisible();
  });
});

