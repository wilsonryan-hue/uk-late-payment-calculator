#!/usr/bin/env node
// Usage: node cli.js --amount 2400 --due 2025-07-31 [--asof 2025-10-29] [--base 4.25] [--ref INV-104]
//        node cli.js --amount 800 --invoice 2026-03-01 [--terms 14 | --delivered 2026-03-10]
const L = require("./latepay.js");
const a = {}; process.argv.slice(2).forEach((v, i, arr) => { if (v.startsWith("--")) a[v.slice(2)] = arr[i + 1]; });
if (!a.amount || !(a.due || a.invoice)) { console.log("Usage: node cli.js --amount 2400 --due 2025-07-31 [--asof YYYY-MM-DD] [--base 4.25] [--ref INV-104]"); process.exit(1); }
const r = L.calculate({ amount: a.amount, dueDate: a.due, invoiceDate: a.invoice, termsDays: a.terms, delivered: a.delivered, asOf: a.asof, baseRate: a.base });
if (!r.ok) { console.log(r.reason); process.exit(2); }
if (!r.late) { console.log("Not late yet: due " + r.dueDate + "."); process.exit(0); }
console.log(L.interestInvoiceText(r, a.ref));
