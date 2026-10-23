const L = require("../latepay.js");
let pass = 0, fail = 0;
function eq(name, got, want) { if (JSON.stringify(got) === JSON.stringify(want)) pass++; else { fail++; console.log("FAIL", name, "got", got, "want", want); } }
// GOV.UK worked example: £1,000, base 0.5%, 50 days. GOV.UK rounds the daily figure to 23p first (£11.50);
// exact working gives £11.64. We round only at the end.
let r = L.calculate({ amount: 1000, dueDate: "2026-01-01", asOf: "2026-02-20", baseRate: 0.5 });
eq("govuk annual", r.annualInterest, 85); eq("govuk daily", r.dailyInterest, 0.23); eq("govuk days", r.daysLate, 50); eq("govuk interest", r.interest, 11.64);
eq("fixed 999.99", L.fixedSum(999.99), 40); eq("fixed 1000", L.fixedSum(1000), 70); eq("fixed 9999.99", L.fixedSum(9999.99), 70); eq("fixed 10000", L.fixedSum(10000), 100);
eq("ref Jan", L.referenceDate("2026-01-15"), "2025-12-31"); eq("ref Jul", L.referenceDate("2026-07-01"), "2026-06-30"); eq("ref Jun30", L.referenceDate("2026-06-30"), "2025-12-31");
eq("rate 31 Dec 2025", L.bankRateOn("2025-12-31"), 3.75); eq("rate 17 Dec 2025", L.bankRateOn("2025-12-17"), 4.0); eq("rate 30 Jun 2025", L.bankRateOn("2025-06-30"), 4.25); eq("rate on change day", L.bankRateOn("2025-08-07"), 4.0);
// Debt late from 1 Aug 2025 -> reference 30 Jun 2025 -> 4.25% -> 12.25%
r = L.calculate({ amount: 2400, dueDate: "2025-07-31", asOf: "2025-10-29" });
eq("ref rate used", r.baseRate, 4.25); eq("rate", r.rate, 12.25); eq("days", r.daysLate, 90); eq("interest", r.interest, 72.49); eq("fixed", r.fixedSum, 70); eq("total", r.total, 2542.49);
// No agreed date: 30 days after invoice received or delivery, whichever later
eq("due no terms", L.dueDate({ invoiceDate: "2026-03-01" }), "2026-03-31");
eq("due delivery later", L.dueDate({ invoiceDate: "2026-03-01", delivered: "2026-03-10" }), "2026-04-09");
eq("due terms", L.dueDate({ invoiceDate: "2026-03-01", termsDays: 14 }), "2026-03-15");
// Not late yet
r = L.calculate({ amount: 500, dueDate: "2026-10-30", asOf: "2026-10-23" });
eq("not late", [r.late, r.interest, r.fixedSum, r.total], [false, 0, 0, 500]);
eq("consumer", L.calculate({ amount: 500, dueDate: "2026-01-01", consumer: true }).ok, false);
eq("contract rate", L.calculate({ amount: 500, dueDate: "2026-01-01", contractRate: true }).ok, false);
eq("long terms", L.calculate({ amount: 500, invoiceDate: "2026-01-01", termsDays: 90, asOf: "2026-06-01" }).warnLongTerms, true);
eq("money", L.money(12345.6), "£12,345.60");
let threw = false; try { L.calculate({ amount: 0, dueDate: "2026-01-01" }); } catch (e) { threw = true; } eq("zero amount throws", threw, true);
eq("invoice text", /Total now owed: £2,542.49/.test(L.interestInvoiceText(L.calculate({ amount: 2400, dueDate: "2025-07-31", asOf: "2025-10-29" }))), true);
console.log(pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
