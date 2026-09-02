import { test, expect, type Page } from "@playwright/test";
import {
  ensureE2EGeneralAdmin,
  ensureE2EDriver,
  ensureE2EVehicle,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./seed-admin";

/**
 * The printing half of the QR feature, end to end in a real browser:
 * a real signed-in admin, real records, and the actual SVG the encoder
 * produced in a Server Component / Server Action.
 *
 * The scanning half lives in fleetly-mobile
 * (src/lib/qr-payload.test.ts). What ties the two together is the
 * payload string asserted here — `fleetly:vehicle:<uuid>` and
 * `fleetly:badge:<token>` are exactly the strings that suite parses, so
 * a change to the format on either side turns one of them red.
 */

let vehicleId: string;
let driverId: string;

test.beforeAll(async () => {
  await ensureE2EGeneralAdmin();
  vehicleId = ensureE2EVehicle();
  driverId = ensureE2EDriver();
});

async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
}

test("a vehicle's detail page shows a scannable QR code", async ({ page }) => {
  await signIn(page);
  await page.goto(`/vehicles/${vehicleId}`);

  const qr = page.getByTestId("qr-code");
  await expect(qr).toBeVisible();

  // A real rendered QR, not an empty box: the encoder emits <path>
  // elements, and a blank <svg> would still "be visible".
  await expect(qr.locator("svg path").first()).toBeAttached();

  // The id is printed under the code so a scuffed sticker is still
  // usable by hand — and it's what the mobile app's manual entry takes.
  await expect(page.getByText(vehicleId)).toBeVisible();
});

test("the vehicle QR encodes the fleetly:vehicle payload the driver app parses", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/vehicles/${vehicleId}`);
  await expect(page.getByTestId("qr-code")).toBeVisible();

  // Decoded from the rendered SVG rather than trusted from the source:
  // this asserts what a camera would actually read off the screen.
  const decoded = await decodeQrFromSvg(page);
  expect(decoded).toBe(`fleetly:vehicle:${vehicleId}`);
});

test("issuing a badge shows a QR encoding the fleetly:badge payload, once", async ({ page }) => {
  await signIn(page);
  await page.goto(`/drivers/${driverId}`);

  await page.getByRole("button", { name: "Issue badge" }).click();

  const qr = page.getByTestId("qr-code");
  await expect(qr).toBeVisible();
  await expect(qr.locator("svg path").first()).toBeAttached();

  const decoded = await decodeQrFromSvg(page);
  expect(decoded).toMatch(/^fleetly:badge:.+/);

  // The raw token is shown alongside the code — it exists nowhere else
  // after this moment (the API stores only its hash), so the screen has
  // to carry it in a form a dispatcher can also transcribe.
  const token = decoded.replace("fleetly:badge:", "");
  expect(token.length).toBeGreaterThan(8);
  await expect(page.getByText(token, { exact: false })).toBeVisible();
});

/**
 * Reads the QR back out of the DOM the way a scanner would. jsQR wants
 * pixels, so the SVG is painted to a canvas first — this is what makes
 * these assertions about the actual printed artifact rather than about
 * the string we happened to pass into the encoder.
 */
async function decodeQrFromSvg(page: Page): Promise<string> {
  await page.addScriptTag({
    path: require.resolve("jsqr/dist/jsQR.js"),
  });

  return page.evaluate(async () => {
    const host = document.querySelector('[data-testid="qr-code"]');
    const svg = host?.querySelector("svg");
    if (!svg) throw new Error("No QR svg on the page");

    const size = 512;
    const serialized = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.width = size;
    image.height = size;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("QR svg failed to load as an image"));
      image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(serialized)))}`;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2d canvas context");
    // The encoder's own quiet zone is transparent, which reads as black
    // on an empty canvas and defeats the scan — paint white first.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    const { data, width, height } = context.getImageData(0, 0, size, size);
    const result = (window as unknown as {
      jsQR: (d: Uint8ClampedArray, w: number, h: number) => { data: string } | null;
    }).jsQR(data, width, height);
    if (!result) throw new Error("Could not decode the rendered QR code");
    return result.data;
  });
}
