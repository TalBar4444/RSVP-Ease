import { expect, test } from '@playwright/test';

test('home page asks guests to use their WhatsApp link', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'החתונה של טל ושקד' })).toBeVisible();
  await expect(page.getByText('29.10.2026')).toBeVisible();
  await expect(page.getByText('בדולינה, רעננה')).toBeVisible();
  await expect(page.getByText('נא להיכנס דרך הקישור האישי שקיבלת בוואטסאפ.')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

  const robots = await page.request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Disallow: /');
});
