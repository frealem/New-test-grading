
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = 3000;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PERMANENT FIX FOR: querySrv ECONNREFUSED
 * If you get this error, your DNS blocks SRV records.
 * 1. Go to MongoDB Atlas > Connect > Drivers.
 * 2. Select Node.js.
 * 3. Change version to "2.2.12 or later" (Standard Connection String).
 * 4. Use that string in your .env. It starts with "mongodb://" NOT "mongodb+srv://".
 */
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('❌ DATABASE ERROR: MONGODB_URI is not defined in environment variables.');
    console.error('👉 ACTION: Create a .env file and add MONGODB_URI=your_mongodb_connection_string');
    console.error('👉 NOTE: The app will run in OFFLINE mode (browser storage only) if you don\'t provide a DB.');
    return;
  }

  if (MONGODB_URI.includes('cluster0.mongodb.net') && !process.env.MONGODB_URI) {
    console.warn('⚠️ DATABASE WARNING: Using placeholder MongoDB URI. This will likely fail.');
  }

  try {
    // We keep bufferCommands at default (true) to prevent the "insertOne before connection" error.
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ DATABASE: Connection established.');
  } catch (err) {
    console.error('❌ DATABASE ERROR:', err.message);
    if (err.message.includes('querySrv ECONNREFUSED')) {
      console.error('---------------------------------------------------------');
      console.error('🚨 DNS BLOCK DETECTED!');
      console.error('👉 ACTION: Use the "Standard Connection String" in .env');
      console.error('👉 format: mongodb://user:pass@host:port/dbname');
      console.error('---------------------------------------------------------');
    }
  }
};

connectDB();

// API Guard: Ensures we don't crash if the DB is still connecting
const dbGuard = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: "Database is connecting or unavailable. Please wait 5 seconds and retry." 
    });
  }
  next();
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Schemas
const Exam = mongoose.model('Exam', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  classDepartment: String,
  teacherName: String,
  createdAt: { type: Number, default: Date.now },
  masterKey: Array 
}));

const Result = mongoose.model('Result', new mongoose.Schema({
  id: String,
  examId: String,
  studentName: String,
  department: String,
  score: Number,
  totalPoints: Number,
  percentage: Number,
  answers: Object, 
  gradingStatus: Object, 
  scannedAt: { type: Number, default: Date.now }
}));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

app.post('/api/exams', dbGuard, async (req, res) => {
  try {
    const newExam = new Exam(req.body);
    await newExam.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exams', dbGuard, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/results', dbGuard, async (req, res) => {
  try {
    const newResult = new Result(req.body);
    await newResult.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/results/:examId', dbGuard, async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId }).sort({ scannedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (e) {
    console.warn('⚠️ VITE WARNING: Could not start Vite middleware. If you are running in production, set NODE_ENV=production.');
    console.warn('Error:', e.message);
  }
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SERVER: Listening on http://0.0.0.0:${PORT}`);
});
