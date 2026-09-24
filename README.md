# 24hrPaydayLoan — static site + lead email function

## Tech stack

- **Frontend:** plain HTML/CSS/JS, no framework, no build step. Lives in `/public`.
- **Backend:** one serverless function (`/api/submit-lead.js`, Node) that
  validates a submission server-side and emails it over TLS via SMTP
  (using `nodemailer`). This avoids exposing sensitive lead data in a raw
  `mailto:` link or client-side request.
- **Hosting:** [Vercel](https://vercel.com) free tier. It serves `/public`
  as static files and auto-deploys any file in `/api` as a serverless
  function at `/api/<filename>` — no server to manage, no separate backend
  hosting needed. (Netlify Functions or Cloudflare Pages Functions would
  work almost identically if you prefer either of those.)

## How the flow works

1. `index.html` — visitor picks an amount, enters email, redirects to
   `apply.html?amount=...&email=...`.
2. `apply.html` — prefills amount/email, collects the rest of the lender
   intake fields, submits as JSON to `/api/submit-lead`.
3. `api/submit-lead.js` — re-validates everything server-side (never trust
   client-side validation alone), then emails a plain-text summary to
   `LEAD_TO_EMAIL` over TLS.

## Deploying

1. `npm install` locally to confirm `package.json` resolves.
2. Push this folder to a GitHub repo.
3. Import the repo in [vercel.com/new](https://vercel.com/new). Vercel
   auto-detects the `/api` function — no config needed.
4. In the Vercel project → **Settings → Environment Variables**, add the
   values from `.env.example` using your real SMTP provider (e.g.
   Postmark, SendGrid, Amazon SES, or your own mail server). Don't use
   your everyday Gmail password — use an app-specific SMTP credential.
5. Deploy. Your live URLs will be `https://<project>.vercel.app/`.
6. Point your custom domain at it under **Settings → Domains** once you've
   registered one.

## Before this goes live — non-technical, but necessary

- **Have your actual lender agreements finalized and confirm what fields
  they require.** The fields here (address, income,
  employment) mirror common industry practice, but your specific lender
  partners may need more, less, or differently formatted data.
- **Get the footer disclosure and Terms/Privacy pages reviewed by a
  lawyer** familiar with state payday-lending / lead-gen regulations
  (licensing requirements differ significantly by state, and several
  states — historically including NY, NH, VT, WV, AR — prohibit this
  type of lending or lead-gen entirely; verify current rules directly,
  don't rely on this list).
- **Confirm your SMTP/email provider's data handling meets your
  obligations under GLBA** (Gramm-Leach-Bliley) since you're transmitting
  nonpublic personal financial information. At minimum: TLS in transit
  (this code does that), and don't leave leads sitting unencrypted in a
  personal inbox indefinitely — consider auto-archiving to encrypted
  storage and deleting from the inbox on a schedule.
- **`terms.html`, `privacy.html`, `how-it-works.html`, `faq.html`** are
  linked from the site but not yet built — they need real content
  specific to your business, states served, and lender network, not
  placeholder text.
- Add a **captcha or rate-limit** (e.g. Cloudflare Turnstile, or a Vercel
  Edge Middleware rate limiter) in front of `/api/submit-lead` before
  going live publicly — the honeypot field here deters basic bots but not
  a determined one.

Nothing in this repo reproduces LendYou.com's code, copy, or trademarks —
the layout pattern (amount selector → email capture → detail form) is
generic across the payday lead-gen industry, but wording, disclosures,
color/type system, and structure here are original.
