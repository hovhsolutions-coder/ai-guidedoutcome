import { test, expect } from '@playwright/test';

/**
 * E2E Test: Dossier Overview
 * Verifies the app loads and the dossier list renders from SQLite data
 */

test.describe('Dossier Overview', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded with current homepage content
    await expect(page.locator('h1')).toContainText(/Move the next|dossier forward/i);
    await expect(page.getByRole('link', { name: /Start a dossier/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open queue/i })).toBeVisible();
  });

  test('/dossiers loads and displays dossier list', async ({ page }) => {
    await page.goto('/dossiers');

    await expect(page.locator('main').getByRole('heading', { name: 'Priority queue', exact: true })).toBeVisible();
    await expect(page.getByText('E2E Test: Execution Mode').first()).toBeVisible();
  });

  test('dossier list renders from SQLite data', async ({ page }) => {
    await page.goto('/dossiers');

    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2E Test: Execution Mode').first()).toBeVisible();
    await expect(page.getByText('E2E Test: Structuring Mode').first()).toBeVisible();
  });
});
