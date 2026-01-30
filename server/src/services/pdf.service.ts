export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");

  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 10000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
