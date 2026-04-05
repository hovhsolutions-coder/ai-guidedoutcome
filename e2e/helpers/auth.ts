import { expect, type Page } from '@playwright/test';

export const E2E_AUTH = {
  name: 'E2E User',
  email: 'e2e@guidedoutcome.app',
  password: 'Password123!',
};

export async function signInAsSeedUser(page: Page, nextPath = '/dashboard') {
  await page.goto(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();
  await page.getByLabel('Email').fill(E2E_AUTH.email);
  await page.getByLabel('Password').fill(E2E_AUTH.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${nextPath.replace('/', '\\/')}($|\\?)`), { timeout: 15000 });
}
