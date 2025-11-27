// server.js — TechVerse (Improved & Resolved)

const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

// Data file paths
const NEWS_FILE = path.join(__dirname, 'data', 'news.json');
const MEET_FILE = path.join(__dirname, 'data', 'meetings.json');
const CONTACTS_FILE = path.join(__dirname, 'data', 'contacts.json');

// Helper functions for JSON file operations
function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return { items: [] };
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

//////////////////////////////////////////////////////
// Basic Config, Data Paths, and Initialization
//////////////////////////////////////////////////////
const app = express();
const PORT = process.env.PORT || 3000;


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
app.get('/api/news', async (req, res) => {
  // In a real app, this would dynamically fetch RSS/scrape sites
  try {
    const news = await News.find({});
    res.json({ items: news });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET: Meetings Data
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find({});
    res.json({ items: meetings });
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// POST: Contact Form Submission (using Nodemailer for a real app, here simulated)
app.post('/api/contacts', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
      timestamp: new Date(),
      id: Date.now()
    });
    await newContact.save();
    res.status(200).json({ success: true, message: 'Message recorded successfully.' });
  } catch (err) {
    console.error('Error saving contact:', err);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});

// POST: Meetings creation (Admin only - using a simple token for mock auth)
app.post('/api/meetings', async (req, res) => {
  const adminToken = req.header('x-admin-token');
  // Simple mock token check
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const { title, when, link } = req.body;
  if (!title || !when || !link) {
    return res.status(400).json({ error: 'Missing meeting details' });
  }

  try {
    const newMeeting = new Meeting({
      title,
      when,
      link,
      id: Date.now()
    });
    await newMeeting.save();
    res.status(201).json({ success: true, message: 'Meeting added.' });
  } catch (err) {
    console.error('Error saving meeting:', err);
    res.status(500).json({ error: 'Failed to add meeting' });
  }
});

// DELETE: Meetings deletion (Admin only)
app.delete('/api/meetings/:id', async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const id = parseInt(req.params.id);
  try {
    await Meeting.deleteOne({ id });
    res.json({ success: true, message: 'Meeting deleted.' });
  } catch (err) {
    console.error('Error deleting meeting:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// POST: News creation (Admin only)
app.post('/api/news', (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const { title, description, link } = req.body;
  if (!title || !description || !link) {
    return res.status(400).json({ error: 'Missing news details' });
  }

  const news = readJson(NEWS_FILE);
  news.items.push({ id: Date.now(), title, description, link, date: new Date().toISOString().split('T')[0] });
  writeJson(NEWS_FILE, news);

  res.status(201).json({ success: true, message: 'News added.' });
});

// DELETE: News deletion (Admin only)
app.delete('/api/news/:id', async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const id = parseInt(req.params.id);
  try {
    await News.deleteOne({ id });
    res.json({ success: true, message: 'News deleted.' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// GET: Contacts (Admin only)
app.get('/api/contacts', async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  try {
    const contacts = await Contact.find({});
    res.json({ contacts });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// DELETE: Contacts deletion (Admin only)
app.delete('/api/contacts/:index', async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (adminToken !== 'Admin-Hager' && adminToken !== 'Admin-Malak' && adminToken !== 'Admin-Abdelfatah') {
    return res.status(403).json({ error: 'Invalid admin token' });
  }

  const index = parseInt(req.params.index);
  try {
    const contacts = await Contact.find({});
    if (index >= 0 && index < contacts.length) {
      await Contact.findByIdAndDelete(contacts[index]._id);
      res.json({ success: true, message: 'Contact deleted.' });
    } else {
      res.status(404).json({ error: 'Contact not found.' });
    }
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
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


// For Vercel serverless deployment, export the app
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
