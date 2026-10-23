# UK late payment interest calculator

A free, open-source calculator for UK businesses chasing an overdue invoice from another business. It works out:

- **when the invoice became late** (agreed date, days from invoice, or the 30-day default),
- **statutory interest** at 8% plus the Bank of England base rate in force on the right reference date (30 June or 31 December before the debt became late), from a built-in Bank Rate table,
- the **fixed sum** you can add once per invoice (£40 / £70 / £100),
- the **total owed today**, with every line of the working, and a ready-to-paste interest invoice.

It refuses to calculate statutory interest for private customers or when your contract sets its own rate, because the Late Payment of Commercial Debts (Interest) Act 1998 doesn't allow it.

**[Use it free online](https://www.tchworks.co.uk/uk-late-payment-calculator/)**

## Why another one?

Most online versions make you look up the base rate yourself, use today's rate instead of the reference rate, or hide the working. This one picks the reference rate automatically, shows the sum line by line, and has no tracking, sign-up or server: it is one small JavaScript file that runs in the browser.

## Use it on your own site

Copy `latepay.js` and `index.html` to any web host (GitHub Pages, Netlify, WordPress media folder). No build step, no dependencies.

Or use the logic directly:

```js
const LatePay = require("./latepay.js");
const r = LatePay.calculate({ amount: 2400, dueDate: "2025-07-31", asOf: "2025-10-29" });
// r.rate 12.25, r.daysLate 90, r.interest 72.49, r.fixedSum 70, r.total 2542.49
console.log(LatePay.interestInvoiceText(r, "INV-104"));
```

Command line:

```
node cli.js --amount 2400 --due 2025-07-31 --asof 2025-10-29 --ref INV-104
node cli.js --amount 800 --invoice 2026-03-01 --delivered 2026-03-10
```

### Options for `calculate()`

| Key | Meaning |
|---|---|
| `amount` | Amount owed in pounds |
| `dueDate` | Agreed payment date (`YYYY-MM-DD`) |
| `invoiceDate` + `termsDays` | Due date worked out as invoice date + days |
| `invoiceDate` (+ `delivered`) | No agreed date: 30 days after invoice received, or after delivery if later |
| `asOf` | Work out interest up to this date (default today) |
| `baseRate` | Override the base rate, in % |
| `consumer`, `contractRate` | `true` stops the statutory calculation with the reason |

## Tests

```
node test/test.js
```

31 checks, including the GOV.UK worked example, every fixed-sum boundary, reference-date edges and Bank Rate change days.

## Keeping the base rate current

`BANK_RATE` at the top of `latepay.js` lists every Bank Rate change since 2000, newest first, from the [Bank of England](https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp). When the Bank changes the rate, add a line at the top. Pull requests welcome.

## Still not paid?

If the reminder and the interest invoice don't work, the [UK Ltd Invoice Chase Swipe File](https://www.tchworks.co.uk/shop/ltd-invoice-swipe/?src=github-latepay) (£14.99) has the exact wording for the final notice, letter before action and phone call, and there's a [free letter before action form](https://www.tchworks.co.uk/lba.html?src=github-latepay).

## Sources and disclaimer

Rules from the Late Payment of Commercial Debts (Interest) Act 1998 as set out on [GOV.UK](https://www.gov.uk/late-commercial-payments-interest-debt-recovery). This is general information, not legal advice. For a disputed debt, an insolvent customer or a claim above the small claims limit, get advice.

Made by [TCH Works](https://www.tchworks.co.uk/?src=github-latepay). MIT licence.
