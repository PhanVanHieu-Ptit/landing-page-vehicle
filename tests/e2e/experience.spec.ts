import { test, expect } from '@playwright/test';
const ids = ['presence', 'silhouette', 'detail', 'interior', 'journey', 'invitation'];
test('concept media, chapter navigation, reverse seeks and responsive layout', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => page.locator('.gt-images img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const navigation = page.getByRole('navigation', { name: 'Story chapters' });
  for (const id of [...ids, ...ids.slice().reverse()]) {
    await navigation.locator(`a[href="#${id}"]`).click();
    await expect(navigation.locator('[aria-current="step"]')).toHaveAttribute('href', `#${id}`);
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Explore +' }).click();
  await expect(page.getByRole('navigation', { name: 'Chapters', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Chapters', exact: true }).getByText('The details').click();
  await expect(page.locator('#chapter-menu')).toHaveCount(0);
  await expect(navigation.locator('[aria-current="step"]')).toHaveAttribute('href', '#detail');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await navigation.locator('a[href="#presence"]').click();
  await expect(page.locator('.gt-images img.is-active').last()).toHaveCSS('opacity', '1');
  await expect(page.locator('.gt-images img:not(.is-active)').first()).toHaveCSS('opacity', '0');
  await page.screenshot({ path: info.outputPath('concept.png'), animations: 'disabled' });
  expect(errors).toEqual([]);
});
test('reduced motion keeps all chapters in natural flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.grand-tourer')).toHaveAttribute('data-static', 'true');
  const panels = page.locator('.gt-panel');
  await expect(panels).toHaveCount(6);
  expect(await panels.evaluateAll(elements => elements.every((el, i) => !elements[i + 1] || el.getBoundingClientRect().bottom <= elements[i + 1].getBoundingClientRect().top + 1))).toBe(true);
  await page.locator('#invitation').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Made to be remembered.' })).toBeVisible();
  await page.getByRole('button', { name: 'Experience it again' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
});
test('failed images retain chapter copy and navigation', async ({ page }) => {
  await page.route('**/assets/concept/*', route => route.abort());
  await page.goto('/');
  await expect(page.getByText('Imagery unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'The character', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Measured in feeling.' })).toBeVisible();
});
