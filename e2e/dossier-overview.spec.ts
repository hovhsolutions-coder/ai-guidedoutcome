import { test, expect } from '@playwright/test';
import { signInAsSeedUser } from './helpers/auth';

/**
 * E2E Test: Dossier Overview
 * Verifies the app loads and the dossier list renders from SQLite data
 */

test.describe('Dossier Overview', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded with current homepage content
    await expect(page.locator('h1')).toContainText(/Move the next|dossier forward/i);
    await expect(page.getByRole('link', { name: /Create account/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Sign in$/i }).first()).toBeVisible();
  });

  test('sign-in and sign-up pages render clear account entry', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: 'Start your dossier workspace', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible();
  });

  test('signed-out users are guided into sign-in for protected routes with the right return path', async ({ page }) => {
    await page.goto('/dossiers');

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdossiers$/);
    await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();

    await page.goto('/dossiers/new');
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdossiers%2Fnew$/);
  });

  test('account creation opens a private dashboard', async ({ page }) => {
    const email = `new-user-${Date.now()}@guidedoutcome.app`;

    await page.goto('/sign-up');
    await page.getByLabel('Name').fill('New User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Start your first dossier', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Dossiers', exact: true })).toBeVisible();
  });

  test('/dossiers loads and displays dossier list', async ({ page }) => {
    await signInAsSeedUser(page, '/dossiers');
    await page.goto('/dossiers');

    await expect(page.locator('main').getByRole('heading', { name: 'My Dossiers', exact: true })).toBeVisible();
    await expect(page.getByText('E2E Test: Execution Mode').first()).toBeVisible();
  });

  test('dossier list renders from SQLite data', async ({ page }) => {
    await signInAsSeedUser(page, '/dossiers');
    await page.goto('/dossiers');

    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2E Test: Execution Mode').first()).toBeVisible();
    await expect(page.getByText('E2E Test: Structuring Mode').first()).toBeVisible();
  });
});
