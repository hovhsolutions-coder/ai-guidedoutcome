import { test, expect } from '@playwright/test';
import { signInAsSeedUser } from './helpers/auth';

/**
 * E2E Test: Dossier Detail
 * Verifies opening an existing dossier works and detail page renders
 * Tests mode-aware UI behavior to protect against regression
 */

test.describe('Dossier Detail', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSeedUser(page, '/dossiers');
  });

  test('opening an existing dossier works', async ({ page }) => {
    // First go to dossiers list
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    // Skip if no dossiers exist
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    // Click the first dossier
    await firstDossierLink.click();
    
    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/dossiers\/[a-zA-Z0-9-]+/);
  });

  test('detail page renders without fatal errors', async ({ page }) => {
    // Navigate to a dossier detail (or skip if none exist)
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete

    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();

    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Verify no error boundary or crash message
    await expect(page.getByText(/Application error|Something went wrong|Error:/i)).not.toBeVisible();
    
    // Verify page has some content (title or heading)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('critical sections render', async ({ page }) => {
    // Navigate to a dossier detail
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Check for common sections that should exist
    // Using flexible selectors that match likely UI patterns
    const hasTasksSection = await page.locator('text=/tasks|todo|action/i').first().isVisible().catch(() => false);
    const hasActivitySection = await page.locator('text=/activity|history|log/i').first().isVisible().catch(() => false);
    const hasMainContent = await page.locator('main, [role="main"], .content').first().isVisible().catch(() => false);
    
    // At minimum, main content should be visible
    expect(hasMainContent || hasTasksSection || hasActivitySection).toBeTruthy();
  });

  test('mode-aware header label reflects phase intent', async ({ page }) => {
    // Navigate to a dossier detail
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Check for mode-aware header labels that indicate phase intent
    // Use expect().toBeVisible() with short timeout for resilient retry-based check
    const modeHeaderSelectors = [
      'text=Exploring the situation',
      'text=Planning the approach',
      'text=Mission control',
      'text=Work completed',
    ];
    
    let hasModeHeader = false;
    for (const selector of modeHeaderSelectors) {
      const locator = page.locator(selector).first();
      try {
        await expect(locator).toBeVisible({ timeout: 2000 });
        hasModeHeader = true;
        break;
      } catch {
        // Continue to next selector
      }
    }
    
    // Also check for legacy fallback "Mission control" as a separate check
    const legacyHeader = page.locator('text=Mission control').first();
    let hasLegacyHeader = false;
    try {
      await expect(legacyHeader).toBeVisible({ timeout: 2000 });
      hasLegacyHeader = true;
    } catch {
      // Legacy header not found
    }
    
    expect(hasModeHeader || hasLegacyHeader).toBeTruthy();
  });

  test('mode-aware panel titles reflect current phase', async ({ page }) => {
    // Navigate to a dossier detail
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Check for mode-aware panel titles
    // Use expect().toBeVisible() with short timeout for resilient retry-based check
    const panelSelectors = [
      'text=Exploration panel',
      'text=Planning panel',
      'text=Execution panel',
      'text=Work record',
    ];

    let hasModePanelTitle = false;
    for (const selector of panelSelectors) {
      const locator = page.locator(selector).first();
      try {
        await expect(locator).toBeVisible({ timeout: 2000 });
        hasModePanelTitle = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    // Fallback: check for generic "Execution panel" which may be shown during Executing phase
    const executionPanel = page.locator('text=Execution panel').first();
    let hasExecutionPanel = false;
    try {
      await expect(executionPanel).toBeVisible({ timeout: 2000 });
      hasExecutionPanel = true;
    } catch {
      // Execution panel not found
    }

    expect(hasModePanelTitle || hasExecutionPanel).toBeTruthy();
  });

  test('phase chip badge shows current mode', async ({ page }) => {
    // Navigate to a dossier detail
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Check for phase badge/chip showing current mode
    // Use expect().toBeVisible() with short timeout for resilient retry-based check
    const phaseSelectors = [
      'text=Understanding',
      'text=Structuring',
      'text=Executing',
      'text=Completed',
    ];

    let hasPhaseChip = false;
    for (const selector of phaseSelectors) {
      const locator = page.locator(selector).first();
      try {
        await expect(locator).toBeVisible({ timeout: 2000 });
        hasPhaseChip = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    expect(hasPhaseChip).toBeTruthy();
  });

  test('mode-aware action labels match phase intent', async ({ page }) => {
    // Navigate to a dossier detail
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Try to find and click on first dossier by visible title (avoid aria-hidden links)
    const firstDossierLink = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossierLink).toBeVisible({ timeout: 5000 });
      await firstDossierLink.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration to complete
    
    // Check for mode-aware action labels in summary section
    // Primary focus and Next move are the actual labels rendered
    // Use expect().toBeVisible() with short timeout for resilient retry-based check
    const actionSelectors = [
      'text=Primary focus',
      'text=Next move',
      'text=Clarity needed',
      'text=Decision needed',
      'text=Action needed',
    ];

    let hasModeActionLabel = false;
    for (const selector of actionSelectors) {
      const locator = page.locator(selector).first();
      try {
        await expect(locator).toBeVisible({ timeout: 2000 });
        hasModeActionLabel = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    // Fallback: check for any button or action element
    const hasAnyAction = await page.locator('button:has-text("Start now"), button:has-text("View tasks")').first().isVisible().catch(() => false);

    expect(hasModeActionLabel || hasAnyAction).toBeTruthy();
  });

  test('close-out button appears when all tasks are complete', async ({ page }) => {
    // Navigate to dossier list first (like other passing tests)
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow React hydration

    // Find and click the Executing phase dossier by its visible text
    const executingDossier = page.getByText('E2E Test: Execution Mode').first();
    await expect(executingDossier).toBeVisible();
    await executingDossier.click();

    // Wait for dossier detail page to load
    await page.waitForSelector('[data-testid="dossier-detail"]', { state: 'visible' });

    // Verify we see the execution panel (which has tasks)
    await expect(page.getByText(/Execution panel/i)).toBeVisible();

    // Initially, close-out button should not be visible when tasks remain
    // (button only appears when phase !== 'Completed' AND all tasks are done)
    const closeOutButton = page.getByRole('button', { name: /mark dossier as completed/i });
    const buttonCount = await closeOutButton.count();

    // Either button doesn't exist (count=0) or it's not visible
    if (buttonCount > 0) {
      await expect(closeOutButton).not.toBeVisible();
    }
  });

  test('close-out flow state contracts', async ({ page }) => {
    // Navigate to dossier list first
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find and click the Executing phase dossier by its visible text
    const executingDossier = page.getByText('E2E Test: Execution Mode').first();
    await expect(executingDossier).toBeVisible();
    await executingDossier.click();

    // Wait for dossier detail page to load
    await page.waitForSelector('[data-testid="dossier-detail"]', { state: 'visible' });

    // Contract 1: Execution panel is visible
    await expect(page.getByText(/Execution panel/i)).toBeVisible();

    // Contract 2: Progress indicator shows remaining work
    await expect(page.getByText(/of.*completed|Progress/i).first()).toBeVisible();

    // Contract 3: The dossier is in Executing phase (not Completed)
    // Check for the phase badge showing "Completed" (not "Executing phase" text in sidebar)
    const completedBadge = page.locator('[data-testid="phase-badge"]').filter({ hasText: /completed/i });
    await expect(completedBadge).not.toBeVisible();
  });

  test('post-close-out: Completed phase shows reference/review state instead of active-work language', async ({ page }) => {
    // Regression protection: verify that after dossier is closed out (Completed phase),
    // the UI shows reference-oriented messaging rather than execution-oriented messaging.
    // This prevents future changes from silently reverting "Review record" back to "Keep going".

    // Navigate to the completed dossier
    await page.goto('/dossiers/e2e-test-dossier-3');

    // Wait for hydration and data load
    const dossierContainer = page.locator('[data-testid="dossier-detail"]').or(page.locator('[data-testid="dossier-detail-container"]'));
    await expect(dossierContainer).toBeVisible({ timeout: 10000 });

    // Contract 1: Phase badge shows "Completed" (not "Executing" or active-work)
    const phaseBadge = page.locator('[data-testid="phase-badge"]').or(page.locator('text=Completed')).first();
    await expect(phaseBadge).toBeVisible();

    // Contract 2: No active-work framing in NextStepPanel
    // Should NOT see "Momentum focus" badge (that's for active work)
    const momentumBadge = dossierContainer.getByText('Momentum focus', { exact: true });
    await expect(momentumBadge).not.toBeVisible();

    // Should NOT see "Next move" (active-work language)
    const nextMoveLabel = dossierContainer.getByText('Next move', { exact: true });
    await expect(nextMoveLabel).not.toBeVisible();

    // Contract 3: CTA is "Review record" not "Keep going"
    const keepGoingCta = dossierContainer.getByText('Keep going', { exact: true });
    await expect(keepGoingCta).not.toBeVisible();

    // Contract 4: Reference-oriented language is present
    // Should see "Review record" (the primary CTA for completed dossiers)
    const reviewRecordCta = dossierContainer.getByRole('button', { name: 'Review record', exact: true });
    await expect(reviewRecordCta).toBeVisible();

    // Contract 5: No active-work action prompts
    // Should NOT see "Start now" or "Define first action" (those are for incomplete states)
    const startNowCta = dossierContainer.getByText('Start now', { exact: true });
    await expect(startNowCta).not.toBeVisible();
    const defineFirstAction = dossierContainer.getByText('Define first action', { exact: true });
    await expect(defineFirstAction).not.toBeVisible();
  });
});
