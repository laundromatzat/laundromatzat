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
    // toBeAttached, not toBeVisible, for the reason spelled out below: a
    // <video> with neither media nor poster loaded collapses to zero height,
    // so visibility would be asserting that the network is up.
    await expect(page.locator("video")).toBeAttached();
  });

  test("closing the player returns to the library", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("project-grid").locator("li").first().click();
    await page.getByRole("button", { name: "Close" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("video")).toHaveCount(0);
  });
});

test.describe("Video playback", () => {
  test("points the player at the video's own file", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("project-grid").locator("li").first().click();

    const video = page.locator("video");
    // toBeAttached, not toBeVisible: a <video> whose media and poster have not
    // loaded collapses to zero height, so visibility here would be asserting
    // that the network is up rather than that the player was wired correctly.
    await expect(video).toBeAttached();
    // The source is assigned by useAdaptiveVideoSource rather than a <source>
    // child, so assert the element really ends up pointed at the media. Which
    // form that takes depends on the path taken: the bucket URL for native HLS
    // and for the progressive file, a blob: MediaSource for hls.js.
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src))
      .toMatch(/^(blob:|https:\/\/firebasestorage\.googleapis\.com)/);
    // ...and that it settled on one of them rather than finding nothing to play.
    await expect(video).not.toHaveAttribute("data-video-source", "none");
  });

  test("keeps the poster while the video loads", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("project-grid").locator("li").first().click();

    await expect(page.locator("video")).toBeAttached();
    await expect(page.locator("video")).toHaveAttribute("poster", /https?:\/\//);
  });
});
