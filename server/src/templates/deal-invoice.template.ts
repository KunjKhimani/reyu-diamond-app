/**
 * Data shape used to render the deal invoice HTML (populated deal from getDealByIdService).
 */
export interface DealInvoiceData {
  _id: unknown;
  status: string;
  agreedAmount: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  buyerId?: { username?: string; email?: string; _id?: unknown } | unknown;
  sellerId?: { username?: string; email?: string; _id?: unknown } | unknown;
  inventoryId?: { _id?: unknown } | unknown;
  bidId?: { _id?: unknown } | unknown;
}

function getStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "username" in (v as object))
    return String((v as { username?: string }).username ?? "");
  if (typeof v === "object" && "email" in (v as object))
    return String((v as { email?: string }).email ?? "");
  if (typeof v === "object" && "_id" in (v as object))
    return String((v as { _id?: unknown })._id ?? "");
  return String(v);
}

/**
 * Returns full HTML for the deal invoice with embedded CSS (for Puppeteer PDF).
 */
export function getDealInvoiceHtml(deal: DealInvoiceData): string {
  const buyer = deal.buyerId as { username?: string; email?: string } | undefined;
  const seller = deal.sellerId as { username?: string; email?: string } | undefined;
  const invId = deal.inventoryId as { _id?: unknown } | undefined;
  const bidIdVal = deal.bidId as { _id?: unknown } | undefined;

  const createdStr =
    deal.createdAt instanceof Date
      ? deal.createdAt.toISOString()
      : typeof deal.createdAt === "string"
        ? deal.createdAt
        : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deal Invoice - ${String(deal._id)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      padding: 24px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
    }
    .header .sub {
      margin-top: 4px;
      font-size: 12px;
      color: #64748b;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; }
    .amount {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
    }
    .meta { font-size: 12px; color: #64748b; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>DEAL INVOICE</h1>
    <div class="sub">Deal ID: ${String(deal._id)}</div>
  </div>

  <div class="section">
    <div class="section-title">Deal summary</div>
    <div class="row">
      <span class="label">Status</span>
      <span class="value">${escapeHtml(deal.status)}</span>
    </div>
    <div class="row">
      <span class="label">Agreed amount</span>
      <span class="amount">₹${formatNumber(deal.agreedAmount)}</span>
    </div>
    <div class="row">
      <span class="label">Created at</span>
      <span class="value meta">${escapeHtml(createdStr)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Buyer details</div>
    <div class="row">
      <span class="label">Name</span>
      <span class="value">${escapeHtml(buyer?.username ?? "")}</span>
    </div>
    <div class="row">
      <span class="label">Email</span>
      <span class="value">${escapeHtml(buyer?.email ?? "")}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Seller details</div>
    <div class="row">
      <span class="label">Name</span>
      <span class="value">${escapeHtml(seller?.username ?? "")}</span>
    </div>
    <div class="row">
      <span class="label">Email</span>
      <span class="value">${escapeHtml(seller?.email ?? "")}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">References</div>
    <div class="row">
      <span class="label">Inventory ID</span>
      <span class="value meta">${escapeHtml(invId?._id != null ? String(invId._id) : getStr(deal.inventoryId))}</span>
    </div>
    <div class="row">
      <span class="label">Bid ID</span>
      <span class="value meta">${escapeHtml(bidIdVal?._id != null ? String(bidIdVal._id) : getStr(deal.bidId))}</span>
    </div>
  </div>

  <div class="footer">
    Generated on ${new Date().toISOString()} · This document is for record-keeping only.
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}
