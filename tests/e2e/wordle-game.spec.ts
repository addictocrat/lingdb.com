import { test, expect } from '@playwright/test';

test.describe('Wordle Game E2E', () => {
  test('should solve the wordle game with answer "rakı"', async ({ page }) => {
    const gameUrl = 'http://localhost:3000/en/wordle/game/b35760f2-cc28-46c5-bb44-4c05123b232f';
    const answer = 'rakı';

    console.log(`Navigating to ${gameUrl}...`);
    await page.goto(gameUrl);
    await page.waitForLoadState('networkidle');

    // Wait for the game to load
    const guessInput = page.locator('input[placeholder*="GUESS" i], input[placeholder*="TAHMİN" i]');
    await expect(guessInput).toBeVisible({ timeout: 15000 });

    console.log(`Filling the guess: ${answer}...`);
    // Type letter by letter to simulate user behavior
    await guessInput.click();
    await page.keyboard.type(answer);

    console.log('Submitting the guess...');
    await page.keyboard.press('Enter');

    // Verify if the win message appears
    // t("game.win") is "You solved it!" in EN and "Çözdünüz!" in TR
    const winMessage = page.locator('text=/You solved it!|Çözdünüz!/i');
    await expect(winMessage).toBeVisible({ timeout: 15000 });

    console.log('Wordle solved successfully!');

    console.log('Wordle solved successfully!');
  });
});
