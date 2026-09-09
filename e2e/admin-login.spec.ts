import { expect, test } from '@playwright/test';

test('admin route shows the login form', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'כניסת מנהלים' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByLabel('אימייל')).toBeVisible();
  await expect(page.getByLabel('סיסמה')).toBeVisible();
  await expect(page.getByRole('button', { name: 'כניסה' })).toBeVisible();
});
