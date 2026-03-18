import { expect, test } from "@playwright/test";

test("user can navigate from home to movies and tv pages", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Find what fits your preference" })).toBeVisible();

  await page.getByRole("link", { name: "Movies" }).first().click();
  await expect(page.getByRole("heading", { name: "Movies" })).toBeVisible();

  await page.getByRole("link", { name: "TV Shows" }).first().click();
  await expect(page.getByRole("heading", { name: "TV Shows" })).toBeVisible();
});
