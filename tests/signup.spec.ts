import { test, expect } from '@playwright/test';

test('signup flow with email verification', async ({ page }) => {
  await page.goto('http://localhost:3000/en/signup');

  // Fill out the signup form
  await page.fill('input[type="email"]', 'test_user123@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  
  // Submit
  await page.click('button[type="submit"]');

  // Wait for the success message UI to appear
  await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=test_user123@example.com')).toBeVisible();

  // Verify we are not logged in and redirected to dashboard
  expect(page.url()).not.toContain('/dashboard');
});
