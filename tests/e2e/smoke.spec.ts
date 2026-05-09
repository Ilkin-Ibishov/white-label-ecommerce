import { test, expect } from "@playwright/test";

test.describe("smoke: foundational routes", () => {
  test("homepage loads with hero copy and admin link", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /white-label e-commerce/i, level: 1 })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /admin dashboard/i })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /api health check/i })
    ).toBeVisible();
  });

  test("/api/health returns ok status JSON", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      status: "ok",
      version: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  test("login page renders email + password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /admin dashboard/i })
    ).toBeVisible();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  // Beta agent owns product catalog (sprint 1.1). Once `/products` exists and
  // the products API returns data, unskip this test.
  test.skip("product list page renders products grid", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("product-grid")).toBeVisible();
  });
});
