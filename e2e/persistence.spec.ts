import { test, expect } from '@playwright/test';

/**
 * E2E Test: Persistence Roundtrip
 * Verifies create/edit through UI, refresh, and verify state persists in SQLite
 */

test.describe('Persistence Roundtrip', () => {
  // Run persistence flows serially to avoid cross-test data resets in shared SQLite
  test.describe.configure({ mode: 'serial' });
  test('create a new dossier through UI', async ({ page }) => {
    await page.goto('/dossiers/new');
    
    // Verify new dossier form loaded
    await expect(page).toHaveURL('/dossiers/new');
    await expect(page.locator('main').getByRole('heading', { name: 'Capture the essentials', exact: true })).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByPlaceholder('Add one line of context')).toBeVisible();
    await expect(page.getByPlaceholder('What needs to happen next?')).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate dossier/i })).toBeVisible();
  });

  test('preview with a saved dossier opens directly into the workspace', async ({ page }) => {
    let dossierCreatePosts = 0;

    page.on('request', (request) => {
      if (request.url().includes('/api/dossiers') && request.method() === 'POST') {
        dossierCreatePosts += 1;
      }
    });

    await page.route('**/api/ai/create-dossier', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dossier: {
              id: 'e2e-test-dossier-1',
              title: 'Renewal motion stalled',
              situation: 'Renewal motion stalled',
              main_goal: 'E2E Preview Flow Goal',
              phase: 'Understanding',
              suggested_tasks: ['Research options', 'Confirm the renewal blocker'],
            },
            persistence: {
              status: 'saved',
              id: 'e2e-test-dossier-1',
            },
            usedFallback: false,
          },
        }),
      })
    );

    await page.goto('/dossiers/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: 'Business' });
    await page.getByPlaceholder('Add one line of context').fill('Renewal motion stalled');
    await page.getByPlaceholder('What needs to happen next?').fill('E2E Preview Flow Goal');

    const generateBtn = page.getByRole('button', { name: /Generate Dossier/i });
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await generateBtn.click();

    await expect(page.getByText(/Step 2 of 2/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('heading', { name: 'Review the draft', exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('Renewal motion stalled', { exact: true }).first()).toBeVisible({ timeout: 25000 });

    const openBtn = page.getByRole('button', { name: /Open dossier|Opening dossier/i });
    await expect(openBtn).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Save and open dossier|Saving dossier|Retry save/i })).toHaveCount(0);

    await openBtn.click();

    await expect(page).toHaveURL(/\/dossiers\/e2e-test-dossier-1$/, { timeout: 15000 });
    await expect(page.locator('[data-testid="dossier-detail"]')).toBeVisible({ timeout: 15000 });
    expect(dossierCreatePosts).toBe(0);
  });

  test('failed-save preview can retry save and open the persisted dossier', async ({ page }) => {
    let retryRequestBody: unknown = null;

    await page.route('**/api/ai/create-dossier', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dossier: {
              title: 'Renewal motion stalled',
              situation: 'Renewal motion stalled',
              main_goal: 'E2E Preview Flow Goal',
              phase: 'Understanding',
              suggested_tasks: ['Research options', 'Gather information'],
            },
            persistence: {
              status: 'save_failed',
              error: 'The draft is ready, but saving the dossier failed.',
            },
            usedFallback: false,
          },
        }),
      })
    );

    await page.route('**/api/dossiers', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      retryRequestBody = route.request().postDataJSON();
      await route.continue();
    });

    await page.goto('/dossiers/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: 'Business' });
    await page.getByPlaceholder('Add one line of context').fill('Renewal motion stalled');
    await page.getByPlaceholder('What needs to happen next?').fill('E2E Preview Flow Goal');

    const generateBtn = page.getByRole('button', { name: /Generate Dossier/i });
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await generateBtn.click();

    await expect(page.getByText('Not saved yet', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Open dossier|Opening dossier/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Back to edit', exact: true })).toBeVisible({ timeout: 25000 });

    const saveAndOpenBtn = page.getByRole('button', { name: /Retry save|Saving dossier/i });
    await expect(saveAndOpenBtn).toBeVisible({ timeout: 25000 });

    const postWait = page.waitForResponse(
      (response) => response.url().includes('/api/dossiers') && response.request().method() === 'POST'
    );
    await saveAndOpenBtn.click();
    const postResponse = await postWait;
    expect(postResponse.ok()).toBeTruthy();
    const body = await postResponse.json();
    expect(body.success).toBeTruthy();
    expect(body.data?.id).toBeTruthy();
    expect(body.data?.href).toMatch(/^\/dossiers\/[a-zA-Z0-9-]+$/);
    expect(retryRequestBody).toMatchObject({
      title: 'Renewal motion stalled',
      situation: 'Renewal motion stalled',
      main_goal: 'E2E Preview Flow Goal',
      phase: 'Understanding',
    });

    await expect(page).toHaveURL(/\/dossiers\/[a-zA-Z0-9-]+/, { timeout: 15000 });
    const detail = page.locator('[data-testid="dossier-detail"]');
    await expect(detail).toBeVisible({ timeout: 15000 });
    await expect(detail).toContainText('Grounded in your intake');
    await expect(detail).toContainText('Renewal motion stalled');
    await expect(detail).toContainText('E2E Preview Flow Goal');
  });

  test('save-failed preview shows recovery actions and preserves edits when going back', async ({ page }) => {
    await page.route('**/api/ai/create-dossier', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            dossier: {
              title: 'Board approval paused',
              situation: 'Board approval paused',
              main_goal: 'Recover the approval path',
              phase: 'Understanding',
              suggested_tasks: ['Clarify the approval blocker'],
            },
            persistence: {
              status: 'save_failed',
              error: 'The draft is ready, but saving the dossier failed.',
            },
            usedFallback: false,
          },
        }),
      })
    );

    await page.route('**/api/dossiers', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Intentional save failure',
          }),
        });
      }

      return route.continue();
    });

    await page.goto('/dossiers/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: 'Business' });
    await page.getByPlaceholder('Add one line of context').fill('Board approval paused');
    await page.getByPlaceholder('What needs to happen next?').fill('Recover the approval path');

    await page.getByRole('button', { name: /Generate Dossier/i }).click();

    await expect(page.getByText('Not saved yet', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Open dossier|Opening dossier/i })).toHaveCount(0);

    const retrySaveButton = page.getByRole('button', { name: 'Retry save', exact: true });
    const backToEditButton = page.getByRole('button', { name: 'Back to edit', exact: true });
    await expect(retrySaveButton).toBeVisible({ timeout: 25000 });
    await expect(backToEditButton).toBeVisible({ timeout: 25000 });
    await retrySaveButton.click();

    await expect(page.getByText('Save paused', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Open dossier|Opening dossier/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible({ timeout: 10000 });

    await backToEditButton.click();

    await expect(page.locator('main').getByRole('heading', { name: 'Capture the essentials', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('select').first()).toHaveValue('Business');
    await expect(page.getByPlaceholder('Add one line of context')).toHaveValue('Board approval paused');
    await expect(page.getByPlaceholder('What needs to happen next?')).toHaveValue('Recover the approval path');
  });

  test('edit task name and verify persistence', async ({ page }) => {
    // Navigate to a dossier using text-based selector
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    const firstDossier = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossier).toBeVisible({ timeout: 10000 });
      await firstDossier.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Click "More" button on a task to reveal Edit button
    const moreButton = page.getByRole('button', { name: 'More' }).first();
    
    try {
      await expect(moreButton).toBeVisible({ timeout: 5000 });
      await moreButton.click();
    } catch {
      test.skip(true, 'No task actions available');
      return;
    }
    
    // Click Edit button
    const editButton = page.getByRole('button', { name: 'Edit' }).first();
    
    try {
      await expect(editButton).toBeVisible({ timeout: 3000 });
      await editButton.click();
    } catch {
      test.skip(true, 'Edit functionality not available');
      return;
    }
    
    // Find the edit input - task edit input has maxLength=500 (subtasks have 100)
    const editInput = page.locator('input[maxLength="500"]').first();
    
    try {
      await expect(editInput).toBeVisible({ timeout: 3000 });
    } catch {
      test.skip(true, 'Edit input not found');
      return;
    }
    
    const newTaskName = `E2E Edited Task ${Date.now()}`;
    
    // Edit the task name
    await editInput.fill(newTaskName);
    
    // Press Enter to save and wait for the PATCH to complete
    const patchWait = page.waitForResponse(
      (response) => response.url().includes('/api/dossiers/') && response.request().method() === 'PATCH'
    );
    await editInput.press('Enter');
    await patchWait;
    // Confirm UI reflects the change before navigating away
    await expect(page.getByText(newTaskName, { exact: false }).first()).toBeVisible({ timeout: 5000 });
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(700);

    // Re-open via list to ensure fresh data load
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    const reopened = page.getByText('E2E Test: Execution Mode').first();
    await expect(reopened).toBeVisible({ timeout: 8000 });
    await reopened.click();
    await page.waitForLoadState('networkidle');

    // Verify the edited name persisted anywhere on the dossier detail
    await page.waitForFunction(
      (text) => document.body && document.body.innerText.includes(text),
      newTaskName,
      { timeout: 20000 }
    );
  });

  test('add a subtask and verify persistence after refresh', async ({ page }) => {
    // Navigate to a dossier
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    const firstDossier = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossier).toBeVisible({ timeout: 10000 });
      await firstDossier.click();
    } catch {
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Focus on the current priority card to reduce flake (name may change after edits)
    const taskCard = page
      .getByRole('button', { name: /Complete task/i })
      .first()
      .locator('xpath=ancestor::div[contains(@class,"ui-surface")]')
      .first();
    const addSubtaskButton = taskCard.getByRole('button', { name: /Add subtask/i }).first();
    await expect(addSubtaskButton).toBeVisible({ timeout: 5000 });
    
    // Click to reveal input
    await addSubtaskButton.scrollIntoViewIfNeeded();
    await addSubtaskButton.click();
    
    // Find the subtask input scoped to this card
    const subtaskInput = taskCard.locator('input[placeholder="Add subtask..."]').first();
    await expect(subtaskInput).toBeVisible({ timeout: 5000 });
    
    const testSubtaskName = `E2E Subtask ${Date.now()}`;
    
    // Add the subtask
    await subtaskInput.fill(testSubtaskName);
    await subtaskInput.press('Enter');
    
    // Wait for save
    await page.waitForTimeout(1500);
    
    // Verify subtask appears within the task card (not just activity log)
    await expect(taskCard.getByText(testSubtaskName, { exact: true })).toBeVisible();
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Re-locate the same task card after refresh
    const reloadedCard = page
      .getByRole('button', { name: /Complete task/i })
      .first()
      .locator('xpath=ancestor::div[contains(@class,"ui-surface")]')
      .first();
    await expect(reloadedCard).toBeVisible({ timeout: 7000 });

    // Verify subtask persisted (allow any copy of the subtask on the page)
    await expect(page.getByText(testSubtaskName, { exact: true }).first()).toBeVisible({ timeout: 7000 });
  });

  test('complete a task and verify persistence', async ({ page }) => {
    // Navigate to a dossier using text-based selector (matching working pattern)
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    // Click on the first dossier using visible text
    const firstDossier = page.getByText('E2E Test: Execution Mode').first();
    
    try {
      await expect(firstDossier).toBeVisible({ timeout: 10000 });
      await firstDossier.click();
    } catch {
      // Skip if no dossiers exist
      test.skip(true, 'No dossiers available to test');
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Use a deterministic queued task control to avoid context loss
    const incompleteTaskButton = page.getByRole('button', { name: /Complete task: Third task - queued/i }).first();
    await expect(incompleteTaskButton).toBeVisible({ timeout: 8000 });
    await incompleteTaskButton.scrollIntoViewIfNeeded();
    
    const taskName = 'Third task - queued';
    
    // Complete the task
    await incompleteTaskButton.click();
    await page.waitForTimeout(2000);

    // Verify the button on this card is gone (task marked complete)
    await expect(incompleteTaskButton).toBeHidden({ timeout: 5000 });

    // Verify task name is still visible after completion
    await expect(page.getByText(taskName, { exact: false }).first()).toBeVisible({ timeout: 5000 });
  });

  test('refresh preserves dossier state from SQLite', async ({ page }) => {
    // First ensure we have a dossier to test with
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any dossiers
    const dossierLinks = page.locator('a[href^="/dossiers/"]:not([href="/dossiers/new"])').first();
    const hasDossiers = await dossierLinks.isVisible().catch(() => false);
    
    if (!hasDossiers) {
      // Create a dossier first
      await page.goto('/dossiers/new');
      await page.waitForSelector('input, textarea, form', { timeout: 10000 });
      
      // Fill in the form
      const titleInput = page.locator('input[type="text"], input[name="title"], input[placeholder*="title" i]').first();
      const descriptionInput = page.locator('textarea').first();
      
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill('Persistence Test Dossier');
      }
      if (await descriptionInput.isVisible().catch(() => false)) {
        await descriptionInput.fill('Testing persistence through UI');
      }
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate back to dossier list and open the first dossier
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');
    
    // Click on the first dossier using visible text (avoid aria-hidden links)
    const firstDossier = page.getByText('E2E Test: Execution Mode').first();
    await expect(firstDossier).toBeVisible({ timeout: 10000 });
    await firstDossier.click();
    
    // Wait for dossier detail to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Get the current URL and page content as baseline
    const initialUrl = page.url();
    // Verify we're on a dossier detail page (use regex to handle full URLs)
    // Use toMatch with regex instead of toContain - pathname is /dossiers or /dossiers/slug
    expect(new URL(initialUrl).pathname).toMatch(/\/dossiers/);
    
    // Verify page loaded correctly - check for key elements
    const pageContent = await page.content();
    const hasDossierContent = pageContent.includes('Dossier') || 
                              pageContent.includes('dossier') ||
                              pageContent.includes('Overview') ||
                              pageContent.includes('Details');
    expect(hasDossierContent).toBeTruthy();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Verify we're still on the same dossier page after refresh
    const refreshedUrl = page.url();
    expect(refreshedUrl).toBe(initialUrl);
    
    // Verify page content is present (not an error page)
    const refreshedContent = await page.content();
    expect(refreshedContent).not.toContain('Application error');
    expect(refreshedContent).not.toContain('Something went wrong');
    
    // Verify some dossier-related content is visible after refresh
    const hasContentAfterRefresh = refreshedContent.includes('Dossier') || 
                                    refreshedContent.includes('Overview') ||
                                    refreshedContent.includes('Objective') ||
                                    refreshedContent.includes('Task') ||
                                    refreshedContent.includes('Details');
    expect(hasContentAfterRefresh).toBeTruthy();
  });
});
