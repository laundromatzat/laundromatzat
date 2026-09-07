import { test, expect } from "@playwright/test";

test.describe("Music video library", () => {
  test("lists the videos on the home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "laundromatzat.com" })).toBeVisible();

    const grid = page.getByTestId("project-grid");
    await expect(grid).toBeVisible();
    expect(await grid.locator("li").count()).toBeGreaterThan(0);
  });

  test("opens a video in the player and deep-links to it", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("project-grid").locator("li").first().click();

    await expect(page).toHaveURL(/\/vids\/.+/);
    await expect(page.locator("video")).toBeVisible();
  });

  test("closing the player returns to the library", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("project-grid").locator("li").first().click();
    await page.getByRole("button", { name: "Close" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("video")).toHaveCount(0);
  });
});
