// server.js — TechVerse (Improved & Resolved)

const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

//////////////////////////////////////////////////////
// Basic Config, Data Paths, and Initialization
//////////////////////////////////////////////////////
const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const MEET_FILE = path.join(DATA_DIR, 'meetings.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// --- Helper Functions ---
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { items: [] }; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(NEWS_FILE)) writeJson(NEWS_FILE, { items: [] });
if (!fs.existsSync(MEET_FILE)) writeJson(MEET_FILE, { items: [] });
if (!fs.existsSync(CONTACTS_FILE)) writeJson(CONTACTS_FILE, { contacts: [] });


//////////////////////////////////////////////////////
// Middlewares and Rate Limiting
//////////////////////////////////////////////////////
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static assets (images, CSS if external)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);


//////////////////////////////////////////////////////
// Mock Translation Data (Language Resolution)
//////////////////////////////////////////////////////
const translations = {
  'en': {
    'brand': { 'tagline': 'Code • Meetings • Insights' },
    'nav': { 'home': 'Home', 'news': 'News', 'meetings': 'Meetings', 'about': 'About', 'contact': 'Contact' },
    'hero': { 'title': 'TechVerse — where code meets the future' },
    'sections': { 'news': 'Latest Tech Insights', 'meetings': 'Upcoming Meetings', 'about': 'About TechVerse', 'contact': 'Get in Touch' },
    'contact': { 'name_placeholder': 'Your Name', 'send_button': 'Send Message' },
    'pages': { 'meetings_title': 'All Upcoming Tech Meetings' }
  },
  'ar': {
    'brand': { 'tagline': 'تشفير • لقاءات • رؤى' },
    'nav': { 'home': 'الرئيسية', 'news': 'الأخبار', 'meetings': 'اللقاءات', 'about': 'من نحن', 'contact': 'اتصل بنا' },
    'hero': { 'title': 'تيك فيرس - حيث يلتقي الكود بالمستقبل' },
    'sections': { 'news': 'أحدث الرؤى التقنية', 'meetings': 'اللقاءات القادمة', 'about': 'عن تيك فيرس', 'contact': 'تواصل معنا' },
    'contact': { 'name_placeholder': 'اسمك', 'send_button': 'إرسال الرسالة' },
    'pages': { 'meetings_title': 'جميع اللقاءات التقنية القادمة' }
  }
};

// Endpoint to serve translations (Resolves the Language Button issue)
app.get('/locales/:lang.json', (req, res) => {
  const lang = req.params.lang;
  if (translations[lang]) {
    return res.json(translations[lang]);
  }
  // Fallback to English
  return res.status(404).json(translations['en']);
});


//////////////////////////////////////////////////////
// API Endpoints (Data fetching and submission)
//////////////////////////////////////////////////////

// GET: News Data
app.get('/api/news', (req, res) => {
  // In a real app, this would dynamically fetch RSS/scrape sites
  const newsData = readJson(NEWS_FILE);
  res.json(newsData);
});

// GET: Meetings Data
app.get('/api/meetings', (req, res) => {
  const meetData = readJson(MEET_FILE);
  res.json(meetData);
});

// POST: Contact Form Submission (using Nodemailer for a real app, here simulated)
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const contacts = readJson(CONTACTS_FILE);
  contacts.contacts.push({ name, email, message, timestamp: new Date().toISOString() });
  writeJson(CONTACTS_FILE, contacts);

  // Simulation of a successful email send
  res.status(200).json({ success: true, message: 'Message recorded successfully.' });
});

// POST: Meetings creation (Admin only - using a simple token for mock auth)
app.post('/api/meetings', (req, res) => {
  const adminToken = req.header('x-admin-token');
  // Simple mock token check
  if (adminToken !== 'SUPER_SECURE_TOKEN_123') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const { title, when, link } = req.body;
  if (!title || !when || !link) {
    return res.status(400).json({ error: 'Missing meeting details' });
  }

  const meetings = readJson(MEET_FILE);
  meetings.items.push({ id: Date.now(), title, when, link });
  writeJson(MEET_FILE, meetings);

  res.status(201).json({ success: true, message: 'Meeting added.' });
});


//////////////////////////////////////////////////////
// File Routing (SPA Fallback)
//////////////////////////////////////////////////////

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname,'public' ,'about.html'));
});
// Universal file resolver for all other routes (serves dedicated HTML pages)
app.use((req, res) => {
  const reqPath = req.path.replace(/^\/+/, ''); // Clean leading slash

  const candidates = [
    path.join(__dirname, reqPath), // e.g., /about -> /about (if extensionless)
    path.join(__dirname, `${reqPath}.html`), // e.g., /about -> /about.html
  ];

  for (const fp of candidates) {
    try {
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        return res.sendFile(fp);
      }
    } catch (e) { /* ignore file system errors */ }
  }

  // SPA Fallback (404/Unknown routes redirect to index or serve the 404 page)
  const fallback = path.join(__dirname, 'index.html');
  if (fs.existsSync(fallback)) return res.sendFile(fallback);

  return res.status(404).send('Not Found');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});