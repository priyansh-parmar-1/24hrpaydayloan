require('dotenv').config();
const express = require('express');
const path = require('path');
const submitLead = require('./submit-lead');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(function logRequests(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log('Serving home page');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/apply', (req, res) => {
  console.log('Serving apply page');
  res.sendFile(path.join(__dirname, 'apply.html'));
});

app.post('/api/submit-lead', async function requestLogger(req, res) {
  console.log('Lead submission received from:', req.headers['user-agent'] || 'unknown');
  try {
    await submitLead(req, res);
  } catch (error) {
    console.error('Unexpected submitLead error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try after some time.' });
  }
});

app.use(express.static(__dirname));

app.use(function errorHandler(err, req, res, next) {
  console.error('Unhandled app error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Something went wrong. Please try after some time.' });
});

app.listen(PORT, () => {
  console.log(`24hrPaydayLoan app running on http://localhost:${PORT}`);
});
