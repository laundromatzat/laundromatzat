import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and display featured content", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that the main heading is visible
    await expect(page.locator("text=laundromatzat.com")).toBeVisible();

    // Check navigation is present
    await expect(page.locator("text=Home")).toBeVisible();
    await expect(page.locator("text=Videos")).toBeVisible();
    await expect(page.locator("text=Images")).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // Click on Videos link
    await page.click("text=Videos");
    await expect(page).toHaveURL(/.*vids/);

    // Click on Images link
    await page.click("text=Images");
    await expect(page).toHaveURL(/.*images/);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check mobile menu button is visible
    const menuButton = page.locator('[aria-label="Toggle navigation"]');
    await expect(menuButton).toBeVisible();

    // Click menu button
    await menuButton.click();

    // Mobile menu should appear
    await expect(page.locator("text=Tools")).toBeVisible();
  });
});
