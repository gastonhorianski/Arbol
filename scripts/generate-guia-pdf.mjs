import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "docs", "GUIA_EQUIPO.html");
const pdfPath = path.join(root, "docs", "GUIA_EQUIPO.pdf");
const pdfAltPath = path.join(root, "docs", "GUIA_EQUIPO_NUEVA.pdf");

const puppeteer = await import("puppeteer");
const browser = await puppeteer.default.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });

const pdfOptions = {
  format: "A4",
  printBackground: true,
  margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
};

let out = pdfPath;
try {
  await page.pdf({ ...pdfOptions, path: pdfPath });
} catch (err) {
  if (err && err.code === "EBUSY") {
    out = pdfAltPath;
    await page.pdf({ ...pdfOptions, path: pdfAltPath });
  } else {
    await browser.close();
    throw err;
  }
}

await browser.close();
console.log(`PDF generado: ${out}`);
