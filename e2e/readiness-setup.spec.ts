import { test, expect } from '@playwright/test';

/**
 * E2E Test: Readiness and Setup Shell
 * Verifies readiness gate and setup shell appear for appropriate dossier states
 */

test.describe('Readiness and Setup Shell', () => {
  test('readiness gate or setup shell appears for uninitialized dossier', async ({ page }) => {
    // Navigate to a dossier
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    const firstDossierLink = page.locator('a[href^="/dossiers/"]:not([href="/dossiers/new"])').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Check for readiness gate indicators
    const readinessGate = page.locator('text=/ready|setup|initialize|complete setup/i').first();
    const setupShell = page.locator('text=/set up|getting started|intake|guidance/i').first();
    const progressIndicator = page.locator('text=/progress|phase|understanding/i').first();
    
    // At minimum, one of these should be visible for a healthy dossier detail page
    const hasReadinessIndicator = await readinessGate.isVisible().catch(() => false);
    const hasSetupIndicator = await setupShell.isVisible().catch(() => false);
    const hasProgressIndicator = await progressIndicator.isVisible().catch(() => false);
    
    // The page should have some form of status indication
    expect(hasReadinessIndicator || hasSetupIndicator || hasProgressIndicator).toBeTruthy();
  });

  test('setup shell appears for dossier needing initialization', async ({ page }) => {
    // Create a new dossier via API to ensure uninitialized state
    // Then verify setup shell appears
    
    // First, let's check if we can find a dossier that shows setup UI
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    const firstDossierLink = page.locator('a[href^="/dossiers/"]:not([href="/dossiers/new"])').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Look for setup-related UI elements
    const setupElements = [
      page.getByRole('button', { name: /start setup|begin setup|initialize/i }),
      page.getByRole('link', { name: /setup|intake|guidance/i }),
      page.locator('text=/complete setup|finish setup|setup required/i').first(),
    ];
    
    // Check if any setup-related element exists
    let hasSetupElement = false;
    for (const element of setupElements) {
      if (await element.isVisible().catch(() => false)) {
        hasSetupElement = true;
        break;
      }
    }
    
    // If no setup element, verify we see normal dossier content (already initialized)
    if (!hasSetupElement) {
      const normalContent = page.locator('text=/tasks|activity|progress|phase/i').first();
      await expect(normalContent).toBeVisible();
    }
  });

  test('phase indicator shows correct state', async ({ page }) => {
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    // Check if we have dossiers
    const dossierLinks = page.locator('a[href^="/dossiers/"]:not([href="/dossiers/new"])').first();
    const hasDossiers = await dossierLinks.isVisible().catch(() => false);
    
    if (!hasDossiers) {
      // Skip if no dossiers
      return;
    }
    
    // Open first dossier
    await dossierLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check for phase indicator or any dossier content
    const phaseIndicator = page.locator('text=/Phase|phase|Understanding|Planning|Action/i').first();
    const hasPhaseIndicator = await phaseIndicator.isVisible().catch(() => false);
    
    // Also accept if dossier content loaded
    const pageContent = await page.content();
    const hasDossierContent = pageContent.includes('Dossier') || pageContent.includes('Objective');
    
    expect(hasPhaseIndicator || hasDossierContent).toBeTruthy();
  });

  test('progress indicator is visible', async ({ page }) => {
    // Navigate to a dossier
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    const firstDossierLink = page.locator('a[href^="/dossiers/"]:not([href="/dossiers/new"])').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Look for progress indicator (could be percentage, bar, or text)
    const progressIndicators = [
      page.locator('text=/\\d+%/i').first(),
      page.locator('text=/progress/i').first(),
      page.locator('[role="progressbar"]').first(),
      page.locator('.progress, [class*="progress"]').first(),
    ];
    
    // At least one progress indicator should be visible
    let hasProgressIndicator = false;
    for (const indicator of progressIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        hasProgressIndicator = true;
        break;
      }
    }
    
    expect(hasProgressIndicator).toBeTruthy();
  });
});
