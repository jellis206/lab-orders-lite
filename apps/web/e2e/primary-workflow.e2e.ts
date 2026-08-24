import { expect, test } from "@playwright/test";

test("create a patient and a multi-test order, then verify detail and list", async ({ page }) => {
  const lastName = `E2e${Date.now()}`;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/patients/new");

  const firstName = page.getByLabel("First name");
  for (let attempt = 0; attempt < 10 && !(await firstName.evaluate((input) => input === document.activeElement)); attempt += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(firstName).toBeFocused();
  await expect
    .poll(() => firstName.evaluate((input) => getComputedStyle(input).outlineStyle))
    .toBe("solid");

  await firstName.fill("Nova");
  await page.getByLabel("Last name").fill(lastName);
  await page.getByLabel("Date of birth").fill("1991-06-15");
  await page.getByLabel("Email").fill(`nova.${lastName.toLowerCase()}@example.test`);
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByText("Patient saved successfully.")).toBeVisible();

  await page.goto("/orders/new");
  await page.getByRole("textbox", { name: "Search patients" }).fill(lastName);
  await page
    .getByRole("search", { name: "Search patients" })
    .getByRole("button", { name: "Search" })
    .click();
  await page.getByRole("button", { name: new RegExp(`${lastName}, Nova`) }).click();
  await page.getByRole("checkbox", { name: /CBC/ }).check();
  await page.getByRole("checkbox", { name: /CMP/ }).check();
  await expect(page.getByText("$75.00")).toBeVisible();
  await page.getByRole("button", { name: "Create order" }).click();

  await expect(page.getByRole("heading", { name: `Order for ${lastName}, Nova` })).toBeVisible();
  await expect(page.getByText("$75.00")).toBeVisible();
  await expect(page.getByText("Complete Blood Count")).toBeVisible();
  await expect(page.getByText("Comprehensive Metabolic Panel")).toBeVisible();

  await page.goto("/orders");
  await page.getByLabel("Search orders by patient").fill(lastName);
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("link", { name: `${lastName}, Nova` })).toBeVisible();
  await expect(page.getByText("$75.00")).toBeVisible();
});
