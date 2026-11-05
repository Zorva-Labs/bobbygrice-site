-- Contact-form leads. Source of truth: a 303 to /thank-you/ (or success:true
-- from /api/lead) means a row exists here, so a lead is never lost even while
-- the mail transport is being provisioned. The same shape as the estate's
-- leads table, so the monthly client report reads it unchanged.
CREATE TABLE IF NOT EXISTS leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT, phone TEXT, email TEXT, address TEXT, city TEXT, state TEXT, zip TEXT,
  service TEXT, hear TEXT, message TEXT, page TEXT, country TEXT,
  notified     INTEGER DEFAULT 0,
  notify_error TEXT,
  flag         TEXT   -- why the alert was marked "[Likely solicitation]" (spam.js solicitationReason), or NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
