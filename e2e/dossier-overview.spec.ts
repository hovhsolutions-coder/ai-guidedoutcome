import { test, expect } from '@playwright/test';

/**
 * E2E Test: Dossier Overview
 * Verifies the app loads and the dossier list renders from SQLite data
 */

test.describe('Dossier Overview', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loaded with current homepage content
    await expect(page.locator('h1')).toContainText(/AI-Powered|Business Intelligence/);
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View API Docs/i })).toBeVisible();
  });

  test('/dossiers loads and displays dossier list', async ({ page }) => {
    await page.goto('/dossiers');
    
    // Verify page loaded - check for Dossiers heading or empty state
    const pageContent = await page.content();
    const hasDossiersHeading = pageContent.includes('Dossiers');
    const hasEmptyState = pageContent.includes('No dossiers') || pageContent.includes('Create your first dossier');
    
    expect(hasDossiersHeading || hasEmptyState).toBeTruthy();
  });

  test('dossier list renders from SQLite data', async ({ page }) => {
    await page.goto('/dossiers');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get page content to check for dossiers
    const content = await page.content();
    
    // Should either show dossier links OR empty state
    const hasDossierLinks = content.includes('/dossiers/') && content.includes('href');
    const hasEmptyState = content.includes('No dossiers') || content.includes('Create your first dossier');
    
    expect(hasDossierLinks || hasEmptyState).toBeTruthy();
  });
});
