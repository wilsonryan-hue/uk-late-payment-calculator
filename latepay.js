/*! UK late payment calculator · MIT · https://github.com/wilsonryan-hue/uk-late-payment-calculator */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LatePay = factory();
})(this, function () {
  "use strict";

  // Bank of England Bank Rate changes since 2000 (date changed, % rate).
  // Source: https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp (checked 23 Oct 2026).
  // Add new changes at the TOP when the Bank changes the rate.
  var BANK_RATE = [
    ["2025-12-18", 3.75], ["2025-08-07", 4.00], ["2025-05-08", 4.25], ["2025-02-06", 4.50],
    ["2024-11-07", 4.75], ["2024-08-01", 5.00], ["2023-08-03", 5.25], ["2023-06-22", 5.00],
    ["2023-05-11", 4.50], ["2023-03-23", 4.25], ["2023-02-02", 4.00], ["2022-12-15", 3.50],
    ["2022-11-03", 3.00], ["2022-09-22", 2.25], ["2022-08-04", 1.75], ["2022-06-16", 1.25],
    ["2022-05-05", 1.00], ["2022-03-17", 0.75], ["2022-02-03", 0.50], ["2021-12-16", 0.25],
    ["2020-03-19", 0.10], ["2020-03-11", 0.25], ["2018-08-02", 0.75], ["2017-11-02", 0.50],
    ["2016-08-04", 0.25], ["2009-03-05", 0.50], ["2009-02-05", 1.00], ["2009-01-08", 1.50],
    ["2008-12-04", 2.00], ["2008-11-06", 3.00], ["2008-10-08", 4.50], ["2008-04-10", 5.00],
    ["2008-02-07", 5.25], ["2007-12-06", 5.50], ["2007-07-05", 5.75], ["2007-05-10", 5.50],
    ["2007-01-11", 5.25], ["2006-11-09", 5.00], ["2006-08-03", 4.75], ["2005-08-04", 4.50],
    ["2004-08-05", 4.75], ["2004-06-10", 4.50], ["2004-05-06", 4.25], ["2004-02-05", 4.00],
    ["2003-11-06", 3.75], ["2003-07-10", 3.50], ["2003-02-06", 3.75], ["2001-11-08", 4.00],
    ["2001-10-04", 4.50], ["2001-09-18", 4.75], ["2001-08-02", 5.00], ["2001-05-10", 5.25],
    ["2001-04-05", 5.50], ["2001-02-08", 5.75], ["2000-02-10", 6.00]
  ];
  var DATA_CHECKED = "2026-10-23";
  var DAY = 86400000;

  function parse(d) {
    if (d instanceof Date) return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || "").trim());
    if (!m) throw new Error("Use dates like 2026-10-23, got: " + d);
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function addDays(t, n) { return t + n * DAY; }

  // Bank Rate in force at the end of a given day.
  function bankRateOn(date) {
    var t = parse(date);
    for (var i = 0; i < BANK_RATE.length; i++) if (parse(BANK_RATE[i][0]) <= t) return BANK_RATE[i][1];
    return null; // before the table starts
  }

  // Statutory "reference rate": the Bank Rate in force on 30 June or 31 December
  // immediately before the day the debt became late (the day after the due date).
  function referenceDate(lateFrom) {
    var t = parse(lateFrom), d = new Date(t), y = d.getUTCFullYear();
    return d.getUTCMonth() < 6 ? iso(Date.UTC(y - 1, 11, 31)) : iso(Date.UTC(y, 5, 30));
  }

  function fixedSum(amount) { return amount < 1000 ? 40 : amount < 10000 ? 70 : 100; }
  function pounds(x) { return Math.round(x * 100 + 1e-9) / 100; }

  // Due date: the agreed date, else 30 days after the invoice was received or the
  // goods/service delivered, whichever is later.
  function dueDate(o) {
    if (o.dueDate) return iso(parse(o.dueDate));
    if (o.termsDays != null && o.invoiceDate) return iso(addDays(parse(o.invoiceDate), +o.termsDays));
    var start = parse(o.invoiceReceived || o.invoiceDate);
    if (o.delivered && parse(o.delivered) > start) start = parse(o.delivered);
    return iso(addDays(start, 30));
  }

  function calculate(o) {
    var amount = Number(o.amount);
    if (!(amount > 0)) throw new Error("Amount owed must be more than £0.");
    if (o.consumer) return { ok: false, reason: "The Late Payment of Commercial Debts (Interest) Act 1998 only covers business-to-business debts. You cannot add statutory interest or the fixed sum to a debt owed by a private individual." };
    if (o.contractRate) return { ok: false, reason: "Your contract sets its own late-payment interest rate, so use that rate instead of statutory interest (GOV.UK: you cannot claim statutory interest if there's a different rate of interest in a contract)." };
    var due = dueDate(o);
    var asOf = iso(parse(o.asOf || new Date()));
    var lateFrom = iso(addDays(parse(due), 1));
    var days = Math.round((parse(asOf) - parse(due)) / DAY);
    var refDate = referenceDate(lateFrom);
    var base = o.baseRate != null && o.baseRate !== "" ? Number(o.baseRate) : bankRateOn(refDate);
    if (base == null || isNaN(base)) throw new Error("No Bank Rate for " + refDate + "; enter it yourself.");
    var rate = 8 + base;
    var annual = amount * rate / 100, daily = annual / 365;
    var late = days > 0;
    var interest = late ? daily * days : 0, fixed = late ? fixedSum(amount) : 0;
    return {
      ok: true, late: late, amount: pounds(amount), dueDate: due, lateFrom: lateFrom, asOf: asOf,
      daysLate: late ? days : 0, referenceDate: refDate, baseRate: base, baseRateSource: o.baseRate != null && o.baseRate !== "" ? "entered" : "Bank of England table",
      rate: rate, annualInterest: pounds(annual), dailyInterest: pounds(daily), dailyInterestExact: daily,
      interest: pounds(interest), fixedSum: fixed, total: pounds(amount + pounds(interest) + fixed),
      warnLongTerms: o.termsDays != null && +o.termsDays > 60
    };
  }

  function money(x) { return "£" + Number(x).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function interestInvoiceText(r, ref) {
    ref = ref || "INV-001";
    return [
      "Late payment interest and compensation: invoice " + ref,
      "",
      "Original invoice " + ref + ": " + money(r.amount) + ", due " + r.dueDate + ", unpaid as of " + r.asOf + " (" + r.daysLate + " days late).",
      "Statutory interest at " + r.rate.toFixed(2) + "% a year (8% + Bank of England base rate of " + r.baseRate.toFixed(2) + "% on " + r.referenceDate + "):",
      "  " + money(r.amount) + " x " + r.rate.toFixed(2) + "% / 365 = £" + r.dailyInterestExact.toFixed(4) + " a day x " + r.daysLate + " days = " + money(r.interest),
      "Fixed sum for the cost of recovering the debt: " + money(r.fixedSum),
      "Total now owed: " + money(r.total) + " (interest keeps adding about " + money(r.dailyInterest) + " a day until paid).",
      "",
      "Claimed under the Late Payment of Commercial Debts (Interest) Act 1998."
    ].join("\n");
  }

  return { BANK_RATE: BANK_RATE, DATA_CHECKED: DATA_CHECKED, bankRateOn: bankRateOn, referenceDate: referenceDate,
    fixedSum: fixedSum, dueDate: dueDate, calculate: calculate, money: money, interestInvoiceText: interestInvoiceText };
});
