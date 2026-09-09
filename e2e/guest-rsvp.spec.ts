import { expect, test } from '@playwright/test';

test('preview RSVP can update the mock attending reply', async ({ page }) => {
  await page.goto('/rsvp/preview');

  await expect(page.getByRole('heading', { name: 'תודה רבה' })).toBeVisible();
  await expect(page.getByText('אורח לדוגמה')).toBeVisible();
  await expect(page.getByText('כבר עדכנתם את פרטי ההגעה.')).toBeVisible();

  await page.getByRole('button', { name: 'לעדכון הגעה' }).click();

  await expect(page.getByRole('heading', { name: 'האם תגיעו לחגוג איתנו?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'בטח שמגיעים' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'הוספת מבוגרים' }).click();
  await page.getByRole('button', { name: 'הוספת ילדים' }).click();
  await page.getByRole('button', { name: 'טבעוני' }).click();

  await page.getByRole('button', { name: 'שליחת עדכון' }).click();

  await expect(page.getByRole('heading', { name: 'תודה רבה' })).toBeVisible();
  await expect(page.getByText('התשובה שלך נשמרה במערכת ועודכנה בהצלחה.')).toBeVisible();

  const details = page.getByRole('region', { name: 'פרטי ההזמנה' });
  await expect(details.getByText('מבוגרים')).toBeVisible();
  await expect(details.getByText('3', { exact: true })).toBeVisible();
  await expect(details.getByText('ילדים')).toBeVisible();
  await expect(details.getByText('2', { exact: true })).toBeVisible();
  await expect(details.getByText('צמחוני')).toBeVisible();
  await expect(details.getByText('טבעוני')).toBeVisible();
});
