const nodemailer = require('nodemailer');

const REQUIRED_FIELDS = [
  'loanAmount', 'email', 'firstName', 'lastName', 'phone',
  'address', 'zip', 'employment', 'monthlyIncome'
];

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isDigits(v, len) {
  return new RegExp(`^\\d{${len}}$`).test(v);
}

function normalizeBody(rawBody) {
  if (!rawBody) return {};
  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }
  return rawBody;
}

async function sendLeadEmail(body, req) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const leadToEmail = process.env.LEAD_TO_EMAIL;
  const leadFromEmail = process.env.LEAD_FROM_EMAIL || smtpUser;

  const summary = `
New loan lead — ${body.firstName} ${body.lastName}

Loan amount:      $${body.loanAmount}
Email:            ${body.email}
Phone:            ${body.phone}
Address:          ${body.address}
ZIP:              ${body.zip}
Employment:       ${body.employment}
Monthly income:   ${body.monthlyIncome}

Submitted date:   ${new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date())}
`.trim();

  if (process.env.RESEND_API_KEY) {
    console.log('Attempting to send lead email through Resend to:', leadToEmail);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: leadFromEmail,
        to: [leadToEmail],
        subject: `New lead: ${body.firstName} ${body.lastName} — $${body.loanAmount}`,
        text: summary
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Resend API ${response.status}: ${errorBody}`);
    }

    console.log('Lead email sent successfully through Resend for:', body.email);
    return { skipped: false };
  }

  if (!smtpHost || !smtpUser || !smtpPass || !leadToEmail) {
    console.error('Email configuration is missing. Add RESEND_API_KEY, LEAD_TO_EMAIL, and LEAD_FROM_EMAIL.');
    throw new Error('Email configuration is missing');
  }

  console.log('Attempting to send lead email through SMTP to:', leadToEmail);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  try {
    await transporter.sendMail({
      from: leadFromEmail,
      to: leadToEmail,
      subject: `New lead: ${body.firstName} ${body.lastName} — $${body.loanAmount}`,
      text: summary
    });
    console.log('Lead email sent successfully for:', body.email);
    return { skipped: false };
  } catch (error) {
    console.error('SMTP sendMail failed:', error && error.stack ? error.stack : error);
    throw error;
  }
}

module.exports = async function submitLead(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = normalizeBody(req.body);
  } catch (error) {
    console.error('Invalid JSON payload on submit:', error);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (body.company) {
    console.log('Bot submission detected and ignored.');
    return res.status(200).json({ ok: true });
  }

  console.log('Validating lead submission for:', body.email || 'unknown');

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || String(body[field]).trim() === '') {
      console.error(`Missing required field: ${field}`);
      return res.status(400).json({ error: `Missing field: ${field}` });
    }
  }

  if (!isValidEmail(body.email)) {
    console.error('Invalid email format:', body.email);
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!isDigits(body.phone, 10)) {
    console.error('Invalid phone number:', body.phone);
    return res.status(400).json({ error: 'Phone number must contain exactly 10 digits' });
  }
  if (!isDigits(body.zip, 5)) {
    console.error('Invalid ZIP:', body.zip);
    return res.status(400).json({ error: 'Invalid ZIP' });
  }

  try {
    await sendLeadEmail(body, req);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Lead email sending failed for:', body.email, error && error.stack ? error.stack : error);
    return res.status(500).json({ error: 'Something went wrong. Please try after some time.' });
  }
};
