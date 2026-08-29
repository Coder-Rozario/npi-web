const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const { google } = require('googleapis');
const cron = require('node-cron');
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();
const path = require("path");
const fs = require("fs");
const compression = require("compression");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const crypto = require('crypto');
const { sendEmail, getStudentEmailTemplate, getAdminEmailTemplate, getContactAdminEmailTemplate, getStudentFeedbackAdminEmailTemplate, getParentsFeedbackAdminEmailTemplate } = require("./utils/emailHelper");
require("dotenv").config();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
const UPLOAD_ROOT = path.resolve(__dirname, 'uploads');
const BLACKLIST_FILE = path.resolve(__dirname, 'token_blacklist.json');

// ============================================
// HELPER FUNCTIONS
// ============================================

function debugLog(...args) {
  if (isDev) console.log(...args);
}

function safeCompare(a, b) {
  try {
    const ah = crypto.createHash('sha256').update(String(a || '')).digest();
    const bh = crypto.createHash('sha256').update(String(b || '')).digest();
    return crypto.timingSafeEqual(ah, bh);
  } catch (e) {
    return false;
  }
}

function safeMkdirForUpload(dirPath) {
  try {
    let resolved = path.resolve(dirPath);
    if (!resolved.startsWith(UPLOAD_ROOT)) {
      const rel = dirPath.replace(/^[\\/]+/, '');
      const afterUploads = rel.split(/uploads[\\/]?/i).pop() || '';
      resolved = path.join(UPLOAD_ROOT, afterUploads || '');
    }
    if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
    return resolved;
  } catch (err) {
    console.error('Error creating directory (safeMkdir):', err);
    return null;
  }
}

// ============================================
// FIX: CENTRALIZED HELPER TO BUILD A PUBLIC-SAFE, RELATIVE UPLOAD PATH
// ============================================
function getUploadPublicPath(file) {
  if (!file || !file.path) return null;
  const resolvedPath = path.resolve(file.path);
  let relative = path.relative(UPLOAD_ROOT, resolvedPath).replace(/\\/g, '/');
  // Safety: never allow a path that escapes the uploads root
  relative = relative.replace(/^(\.\.[/\\])+/, '');
  if (!relative) return null;
  return `uploads/${relative}`;
}

// ============================================
// FIXED: Normalize path for database storage
// ============================================
function normalizeDbPath(filePath) {
  if (!filePath) return null;
  // If it's already a relative path starting with 'uploads/', return as is
  if (filePath.startsWith('uploads/')) return filePath;
  // If it's an absolute path, convert to relative
  const resolved = path.resolve(filePath);
  if (resolved.startsWith(UPLOAD_ROOT)) {
    const relative = path.relative(UPLOAD_ROOT, resolved).replace(/\\/g, '/');
    return `uploads/${relative}`;
  }
  return filePath;
}

const UPLOAD_REFERENCE_COLUMNS = [
  { table: 'notice_board', column: 'file_path' },
  { table: 'news_and_events', column: 'image' },
  { table: 'portfolio_items', column: 'imgSrc' },
  { table: 'videos', column: 'video_url' },
  { table: 'photos', column: 'url' },
  { table: 'teachers', column: 'image' },
  { table: 'staff', column: 'image' },
  { table: 'authority', column: 'image' },
  { table: 'academic_data', column: 'image' },
  { table: 'online_admissions', column: 'image' },
  { table: 'department', column: 'hero_image' },
  { table: 'web_data', column: 'intro_bg_url' },
  { table: 'web_data', column: 'ovr_photo' },
  { table: 'about_page', column: 'photo' },
];

function normalizeUploadPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return null;
  let resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    const alt = path.resolve(path.join(__dirname, filePath));
    if (alt.startsWith(UPLOAD_ROOT)) {
      resolved = alt;
    } else {
      return null;
    }
  }
  return resolved;
}

function getCandidateFilePaths(filePath) {
  const candidates = new Set();
  const normalized = filePath ? filePath.replace(/\\/g, '/') : filePath;
  if (normalized) candidates.add(normalized);
  const resolved = normalizeUploadPath(filePath);
  if (resolved) {
    candidates.add(resolved);
    const relative = path.relative(__dirname, resolved).replace(/\\/g, '/');
    if (relative) candidates.add(relative);
    const uploadRelative = path.relative(UPLOAD_ROOT, resolved).replace(/\\/g, '/');
    if (uploadRelative) candidates.add(path.join('uploads', uploadRelative).replace(/\\/g, '/'));
  }
  return Array.from(candidates).filter(Boolean);
}

function executeQueryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    executeQuery(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function isFileReferenced(filePath) {
  const candidates = getCandidateFilePaths(filePath);
  if (!candidates.length) return false;

  const counts = await Promise.all(UPLOAD_REFERENCE_COLUMNS.map(async ({ table, column }) => {
    const placeholders = candidates.map(() => '?').join(',');
    const sql = `SELECT COUNT(*) AS cnt FROM \`${table}\` WHERE \`${column}\` IN (${placeholders})`;
    try {
      const results = await executeQueryAsync(sql, candidates);
      if (results && results[0] && typeof results[0].cnt === 'number') {
        return results[0].cnt;
      }
      return 0;
    } catch (err) {
      if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_WRONG_FIELD_WITH_GROUP')) {
        return 0;
      }
      console.error('Error checking file references for', filePath, 'in', table, column, err);
      return 0;
    }
  }));

  return counts.some(count => count > 0);
}

async function deleteUploadedFile(filePath) {
  try {
    const resolved = normalizeUploadPath(filePath);
    if (!resolved) {
      debugLog('Skipping delete for invalid upload path:', filePath);
      return;
    }
    try {
      await fs.promises.access(resolved, fs.constants.F_OK);
    } catch {
      return;
    }
    const referenced = await isFileReferenced(filePath);
    if (referenced) {
      debugLog('Skipping delete because file is still referenced:', filePath);
      return;
    }
    await fs.promises.unlink(resolved);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.warn('Failed to delete uploaded file:', filePath, err);
    }
  }
}

function safeUnlink(filePath) {
  deleteUploadedFile(filePath).catch(err => {
    if (err && err.code !== 'ENOENT') {
      console.warn('safeUnlink error:', err);
    }
  });
}

function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]+/g, '')
    .trim();
}

function normalizePhone(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[\u0000-\u001F\u007F\s\-()]+/g, '');
}

function validationErrorHandler(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map(({ param, msg }) => ({
        field: param,
        message: msg,
      })),
    });
  }
  next();
}

function sanitizeInput(str) {
  if (str === null || str === undefined) return str;
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<\s*img[^>]*onerror[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/g, '')
    .replace(/on\w+\s*=\s*'[^']*'/g, '')
    .trim();
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
}

// ============================================
// DATABASE CONNECTION
// ============================================

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: isDev ? 10 : 30,
  queueLimit: isDev ? 0 : 50,
  enableKeepAlive: true,
  connectTimeout: isDev ? 10000 : 15000,
});

const executeQuery = (sql, params, callback) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      if (typeof callback === 'function') callback(err, null);
      return;
    }
    connection.query(sql, params, (queryErr, results) => {
      connection.release();
      if (typeof callback === 'function') callback(queryErr, results);
    });
  });
};

// ============================================
// MULTER CONFIGURATION - FIXED
// ============================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads';
    const rawUrl = (req.originalUrl || req.url || '').toLowerCase();

    const useFolder = (folder) => {
      if (!folder) return;
      uploadPath = path.join(uploadPath, folder);
    };

    const overrideFolder = req.overrideUploadFolder;
    if (overrideFolder) {
      useFolder(overrideFolder);
    }

    if (!overrideFolder) {
      if (file.fieldname === 'background') {
        useFolder('Intro');
      } else if (file.fieldname === 'video') {
        useFolder('Videos');
      } else if (file.fieldname === 'image' || file.fieldname === 'photo') {
        useFolder('hero_images');
      }
    }

    if (uploadPath === 'uploads') {
      if (rawUrl.includes('/news') || rawUrl.includes('news_and_events')) useFolder('news_and_events');
      else if (rawUrl.includes('/videos') || rawUrl.includes('/video')) useFolder('Videos');
      else if (rawUrl.includes('about') || rawUrl.includes('portfolio') || rawUrl.includes('profile') || rawUrl.includes('dream') || rawUrl.includes('brief') || rawUrl.includes('authority') || rawUrl.includes('concession')) useFolder('about');
      else if (rawUrl.includes('teacher')) useFolder('teachers');
      else if (rawUrl.includes('staff')) useFolder('staff');
      else if (rawUrl.includes('notice')) useFolder('notices');
      else if (rawUrl.includes('admission') || rawUrl.includes('submit-admission')) useFolder('admission');
      else if (rawUrl.includes('save') || rawUrl.includes('campus')) useFolder('campus');
      else if (rawUrl.includes('feedback')) useFolder('feedback');
      else if (rawUrl.includes('hero-image') || rawUrl.includes('department')) useFolder('department');
      else if (rawUrl.includes('intro') || rawUrl.includes('background')) useFolder('Intro');
      else if (rawUrl.includes('photo')) useFolder('hero_images');
      else if (rawUrl.includes('upload')) useFolder('photos');
      else if (rawUrl.includes('banner')) useFolder('banner');
    }

    uploadPath = uploadPath.replace(/\\/g, '/');
    const resolvedDir = safeMkdirForUpload(uploadPath);
    if (!resolvedDir) {
      return cb(new Error('Failed to create upload directory'), null);
    }
    cb(null, resolvedDir);
  },
  filename: function (req, file, cb) {
    const original = file.originalname || 'file';
    const sanitized = original.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + sanitized);
  }
});

function fileFilter(req, file, cb) {
  const allowedImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDoc = ['application/pdf'];
  const allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const allowed = [...allowedImage, ...allowedDoc, ...allowedVideo];
  const ext = (file.originalname || '').toLowerCase().split('.').pop();
  const allowedImageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedDocExts = ['pdf'];
  const allowedVideoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const allowedExts = [...allowedImageExts, ...allowedDocExts, ...allowedVideoExts];

  if (!allowedExts.includes(ext)) {
    console.warn('File rejected - bad extension:', ext, 'originalname:', file.originalname);
    return cb(new Error('Invalid file extension - allowed: images (jpg,jpeg,png,gif,webp), PDF, videos (mp4,webm,mov,avi,mkv)'), false);
  }
  if (!allowed.includes(file.mimetype)) {
    let extAllowed = false;
    if (allowedImageExts.includes(ext) && allowedImage.includes(file.mimetype)) extAllowed = true;
    if (allowedDocExts.includes(ext) && file.mimetype === 'application/pdf') extAllowed = true;
    if (allowedVideoExts.includes(ext) && allowedVideo.includes(file.mimetype)) extAllowed = true;
    if (!extAllowed) {
      console.warn('File rejected - mismatched mimetype/ext - mimetype:', file.mimetype, 'ext:', ext, 'originalname:', file.originalname);
      return cb(new Error('File type does not match extension'), false);
    }
  }
  return cb(null, true);
}

function publicImageFileFilter(req, file, cb) {
  const allowedPublicImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedPublicExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const ext = (file.originalname || '').toLowerCase().split('.').pop();

  if (!allowedPublicExts.includes(ext)) {
    console.warn('Public upload rejected - bad image extension:', ext, 'originalname:', file.originalname);
    return cb(new Error('Invalid image file extension'), false);
  }
  if (!allowedPublicImage.includes(file.mimetype)) {
    console.warn('Public upload rejected - mismatched image mime type:', file.mimetype, 'ext:', ext, 'originalname:', file.originalname);
    return cb(new Error('Invalid image MIME type'), false);
  }
  return cb(null, true);
}

const upload = multer({
  storage: storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const uploadPublicImage = multer({
  storage: storage,
  fileFilter: publicImageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

function wrapMulter(mw) {
  return function (req, res, next) {
    mw(req, res, function (err) {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Uploaded file is too large. Maximum size is 100MB.' });
        }
        console.error('Multer upload error:', err);
        return res.status(400).json({ error: err.message || 'Invalid file upload' });
      }
      next();
    });
  };
}

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (isDev) return callback(null, true);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression({
  level: process.env.NODE_ENV === 'production' ? 6 : 3,
  threshold: 512,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.set("trust proxy", 1);
app.set("etag", "strong");

app.use((req, res, next) => {
  const csp = [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https: http: https://fonts.googleapis.com",
    "img-src 'self' data: https: http: blob:",
    "connect-src 'self' https: http: ws: wss: blob:",
    "font-src 'self' https: data: https://fonts.googleapis.com https://fonts.gstatic.com",
    "media-src 'self' data: https: http: blob:",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https: http:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "prefetch-src 'self' https:",
    "frame-src 'self' https: https://www.google.com https://google.com https://maps.google.com https://maps.gstatic.com https://maps.googleapis.com https://www.google.com/maps https://consent.google.com https://www.gstatic.com https://googleusercontent.com https://youtube.com https://www.youtube.com https://youtu.be https://player.vimeo.com",
    "child-src 'self' https:"
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: false },
  contentSecurityPolicy: false,
  originAgentCluster: false
}));

app.use(hpp());

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests',
    message: 'Too many requests - please try again in a few seconds.',
  }
});
app.use(globalLimiter);

// Route prefix handling
app.use((req, res, next) => {
  const preserveApiPrefixes = [
    '/api/banners',
    '/api/google-reviews',
    '/api/sync-reviews-manual',
  ];

  if (req.url.startsWith('/api/') && !preserveApiPrefixes.some((prefix) => req.url.startsWith(prefix))) {
    req.url = req.url.slice(4);
  }
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeBody);

// ============================================
// CACHE CONFIGURATION
// ============================================

const responseCache = new Map();
function clearCache() {
  responseCache.clear();
}

function getCacheTTL(url) {
  const staticEndpoints = [
    '/news', '/teachers', '/photos', '/get-notices',
    '/departments', '/videos', '/portfolio', '/campus-activities',
    '/achievements', '/authority', '/contact',
  ];
  const nocacheKeywords = ['message', 'feedback', 'admission', 'latest-image', 'get-', 'unread', 'status', 'details', 'banner'];
  if (nocacheKeywords.some((k) => url.toLowerCase().includes(k))) {
    return 0;
  }
  const lowerUrl = url.toLowerCase();
  const isStatic = staticEndpoints.some(endpoint => {
    const e = endpoint.toLowerCase();
    return lowerUrl === e || lowerUrl.startsWith(e + '/') || lowerUrl.startsWith(e + '?');
  });
  if (isStatic) {
    return 2 * 60 * 1000;
  }
  return 0;
}

function cacheGet() {
  return (req, res, next) => {
    if (req.method !== "GET" || "nocache" in req.query) return next();
    const key = req.originalUrl;
    const now = Date.now();
    const cached = responseCache.get(key);
    const endpointTTL = getCacheTTL(key);
    if (endpointTTL === 0) return next();

    if (cached && now - cached.time < endpointTTL) {
      res.set("X-Cache", "HIT");
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([h, v]) => v && res.set(h, v));
      }
      return res.status(cached.status).send(cached.body);
    }

    const originalSend = res.send.bind(res);
    res.send = (body) => {
      try {
        const maxAge = Math.floor(endpointTTL / 1000);
        const headers = {
          "Cache-Control": maxAge > 0 ? `public, max-age=${maxAge}` : 'no-cache, no-store, must-revalidate',
          "Pragma": maxAge > 0 ? "cache" : "no-cache",
          "X-Content-Type-Options": "nosniff",
          ETag: res.get("ETag") || undefined,
        };
        if (endpointTTL > 0) {
          responseCache.set(key, {
            body,
            time: Date.now(),
            status: res.statusCode,
            headers,
          });
        }
        res.set("X-Cache", "MISS");
      } catch (e) {}
      return originalSend(body);
    };
    next();
  };
}

app.use(cacheGet());

app.use((req, res, next) => {
  res.set('Vary', 'Accept-Encoding');
  if (req.url.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
  }
  next();
});

app.use((req, res, next) => {
  if (["PUT", "DELETE", "PATCH", "POST"].includes(req.method)) {
    try {
      const url = (req.originalUrl || req.url).toLowerCase();
      const preservedPrefixes = ['/api/banners', '/banners', '/google-reviews', '/notice-board'];
      if (preservedPrefixes.some((p) => url.startsWith(p))) {
        clearCache();
      } else {
        const keysToDelete = [];
        for (const k of responseCache.keys()) {
          if (k.includes('/departments') || k.includes('/banner') || k.includes('/get-notices')) {
            keysToDelete.push(k);
          }
        }
        keysToDelete.forEach((k) => responseCache.delete(k));
      }
    } catch (e) {}
  }
  next();
});

// ============================================
// FIXED: AUTHENTICATION - IMPROVED TOKEN VERIFICATION
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'please_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // Changed to 24h for better session
const tokenBlacklist = new Map();

try {
  if (fs.existsSync(BLACKLIST_FILE)) {
    const raw = fs.readFileSync(BLACKLIST_FILE, 'utf8');
    const obj = JSON.parse(raw || '{}');
    const now = Date.now();
    for (const [t, exp] of Object.entries(obj)) {
      if (exp && exp > now) tokenBlacklist.set(t, exp);
    }
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Object.fromEntries(tokenBlacklist)), 'utf8');
  }
} catch (err) {
  console.error('Failed to load token blacklist:', err);
}

function verifyToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
  let token = '';

  if (auth.startsWith('Bearer ')) {
    token = auth.substring(7);
  } else if (auth) {
    token = auth;
  }

  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    console.log('No token provided in request:', req.method, req.url);
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const blacklisted = tokenBlacklist.get(token);
  if (blacklisted && blacklisted > Date.now()) {
    console.log('Token is blacklisted');
    return res.status(401).json({ error: 'Token revoked' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message, 'for:', req.method, req.url);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    console.log('Token verified for user:', decoded.username || decoded.id);
    next();
  });
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const contactFormValidation = [
  body('name')
    .exists({ checkFalsy: true }).withMessage('Name is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
  body('email')
    .exists({ checkFalsy: true }).withMessage('Email is required')
    .bail()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer(normalizePhone)
    .matches(/^\+?[0-9\s\-()]{5,25}$/).withMessage('Invalid phone number'),
  body('message')
    .exists({ checkFalsy: true }).withMessage('Message is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 3, max: 2000 }).withMessage('Message must be between 3 and 2000 characters'),
];

const studentFeedbackValidation = [
  body('name')
    .exists({ checkFalsy: true }).withMessage('Name is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('message')
    .exists({ checkFalsy: true }).withMessage('Message is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 3, max: 2000 }).withMessage('Message must be between 3 and 2000 characters'),
  body('type')
    .exists({ checkFalsy: true }).withMessage('Type is required')
    .bail()
    .trim()
    .isIn(['running', 'finished']).withMessage('Invalid type'),
  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
  body('semester')
    .if(body('type').equals('running'))
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Semester must be between 2 and 100 characters'),
];

const parentsFeedbackValidation = [
  body('name')
    .exists({ checkFalsy: true }).withMessage('Name is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('occupation')
    .exists({ checkFalsy: true }).withMessage('Occupation is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 150 }).withMessage('Occupation must be between 2 and 150 characters'),
  body('message')
    .exists({ checkFalsy: true }).withMessage('Message is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 3, max: 2000 }).withMessage('Message must be between 3 and 2000 characters'),
];

const admissionValidation = [
  body('full_name')
    .exists({ checkFalsy: true }).withMessage('Full name is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('date_of_birth')
    .exists({ checkFalsy: true }).withMessage('Date of birth is required')
    .bail()
    .isISO8601().withMessage('Invalid date of birth'),
  body('father_name')
    .exists({ checkFalsy: true }).withMessage("Father's name is required")
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage("Father's name must be between 2 and 100 characters"),
  body('mother_name')
    .exists({ checkFalsy: true }).withMessage("Mother's name is required")
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage("Mother's name must be between 2 and 100 characters"),
  body('email')
    .exists({ checkFalsy: true }).withMessage('Email is required')
    .bail()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .exists({ checkFalsy: true }).withMessage('Phone is required')
    .bail()
    .trim()
    .customSanitizer(normalizePhone)
    .matches(/^\+?[0-9]{7,20}$/).withMessage('Invalid phone number'),
  body('guardian_phone')
    .exists({ checkFalsy: true }).withMessage('Guardian phone is required')
    .bail()
    .trim()
    .customSanitizer(normalizePhone)
    .matches(/^\+?[0-9]{7,20}$/).withMessage('Invalid guardian phone number'),
  body('address')
    .exists({ checkFalsy: true }).withMessage('Address is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 10, max: 1000 }).withMessage('Address must be between 10 and 1000 characters'),
  body('gender')
    .exists({ checkFalsy: true }).withMessage('Gender is required')
    .bail()
    .trim()
    .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('nationality')
    .exists({ checkFalsy: true }).withMessage('Nationality is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Nationality must be between 2 and 100 characters'),
  body('upojati')
    .exists({ checkFalsy: true }).withMessage('Tribal status is required')
    .bail()
    .trim()
    .isIn(['No', 'Yes']).withMessage('Invalid tribal status'),
  body('freefighter')
    .exists({ checkFalsy: true }).withMessage('Freedom fighter status is required')
    .bail()
    .trim()
    .isIn(['No', 'Yes']).withMessage('Invalid freedom fighter status'),
  body('course_id')
    .exists({ checkFalsy: true }).withMessage('Technology selection is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Technology selection must be between 2 and 100 characters'),
  body('exam_id')
    .exists({ checkFalsy: true }).withMessage('Examination selection is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 50 }).withMessage('Examination selection must be between 2 and 50 characters'),
  body('pass_year')
    .exists({ checkFalsy: true }).withMessage('Passing year is required')
    .bail()
    .isInt({ min: 1900, max: 2100 }).withMessage('Invalid passing year'),
  body('devition')
    .exists({ checkFalsy: true }).withMessage('Group/Division is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 1, max: 100 }).withMessage('Division must be between 1 and 100 characters'),
  body('board')
    .exists({ checkFalsy: true }).withMessage('Board is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 100 }).withMessage('Board must be between 2 and 100 characters'),
  body('b_roll')
    .exists({ checkFalsy: true }).withMessage('Board roll is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 50 }).withMessage('Board roll must be between 2 and 50 characters'),
  body('r_number')
    .exists({ checkFalsy: true }).withMessage('Registration number is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 50 }).withMessage('Registration number must be between 2 and 50 characters'),
  body('gpa')
    .exists({ checkFalsy: true }).withMessage('GPA is required')
    .bail()
    .isFloat({ min: 0, max: 5 }).withMessage('Invalid GPA'),
  body('transaction_amount')
    .exists({ checkFalsy: true }).withMessage('Transaction amount is required')
    .bail()
    .isFloat({ min: 0 }).withMessage('Invalid transaction amount'),
  body('btransaction_id')
    .exists({ checkFalsy: true }).withMessage('bKash Transaction ID is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 3, max: 100 }).withMessage('Transaction ID must be between 3 and 100 characters'),
  body('transaction_reference')
    .exists({ checkFalsy: true }).withMessage('Transaction reference is required')
    .bail()
    .trim()
    .customSanitizer(sanitizeText)
    .isLength({ min: 3, max: 150 }).withMessage('Transaction reference must be between 3 and 150 characters'),
];

// ============================================
// RATE LIMITERS FOR FORMS
// ============================================

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many submissions from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const submitAdmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many admission submissions from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// DYNAMIC UPDATE HELPER
// ============================================

const dynamicUpdate = (table, updates, whereClause, whereValues, res, postUpdate) => {
  const allowedTables = new Set([
    'contacts', 'notice_board', 'news_and_events', 'web_data', 'teachers', 'staff', 'portfolio_items',
    'videos', 'counters', 'photos', 'authority', 'about_page', 'academic_data', 'studentfeedback',
    'parents_feedback', 'online_admissions', 'admin_users', 'department', 'admission_instraction'
  ]);
  if (!allowedTables.has(table)) {
    return res.status(400).json({ error: 'Invalid table for update' });
  }
  const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
  if (fields.length === 0) {
    return res.status(200).json({ message: "No changes to update" });
  }
  const invalidField = fields.find(f => !/^[a-zA-Z0-9_]+$/.test(f));
  if (invalidField) return res.status(400).json({ error: 'Invalid field name' });
  const setClause = fields.map(field => `\`${field}\` = ?`).join(", ");
  const values = fields.map(field => updates[field]);
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  executeQuery(sql, [...values, ...whereValues], (err, result) => {
    if (err) {
      console.error(`Error updating ${table}:`, err);
      console.error('Update query:', sql);
      console.error('Update values:', [...values, ...whereValues]);
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(200).json({ message: "Update skipped: Table does not exist", error: "TABLE_MISSING" });
      }
      return res.status(500).json({ error: `Failed to update ${table}`, detail: err.message });
    }
    if (result && result.affectedRows > 0) {
      if (typeof postUpdate === 'function') {
        try {
          postUpdate();
        } catch (postErr) {
          console.error('Post-update cleanup error:', postErr);
        }
      }
      res.status(200).json({ message: "Updated successfully!" });
    } else {
      res.status(404).json({ error: "No record found to update" });
    }
  });
};

// ============================================
// ENSURE TABLE COLUMNS
// ============================================

const ensurePhotosTitleColumn = (callback) => {
  executeQuery("SHOW COLUMNS FROM photos LIKE 'title'", [], (err, results) => {
    if (err) return callback(err);
    if (results && results.length > 0) return callback(null);
    executeQuery("ALTER TABLE photos ADD COLUMN title VARCHAR(255) DEFAULT ''", [], callback);
  });
};

const ensureWebDataIntroBgColumns = (callback) => {
  executeQuery("SHOW COLUMNS FROM web_data LIKE 'intro_bg_type'", [], (err, results) => {
    if (err) return callback(err);
    const hasType = results && results.length > 0;
    executeQuery("SHOW COLUMNS FROM web_data LIKE 'intro_bg_url'", [], (err2, results2) => {
      if (err2) return callback(err2);
      const hasUrl = results2 && results2.length > 0;
      if (hasType && hasUrl) return callback(null);
      if (!hasType) {
        executeQuery("ALTER TABLE web_data ADD COLUMN intro_bg_type VARCHAR(50) DEFAULT NULL", [], (typeErr) => {
          if (typeErr) return callback(typeErr);
          if (!hasUrl) {
            executeQuery("ALTER TABLE web_data ADD COLUMN intro_bg_url VARCHAR(500) DEFAULT NULL", [], callback);
          } else {
            callback(null);
          }
        });
      } else if (!hasUrl) {
        executeQuery("ALTER TABLE web_data ADD COLUMN intro_bg_url VARCHAR(500) DEFAULT NULL", [], callback);
      } else {
        callback(null);
      }
    });
  });
};

// ============================================
// DATABASE INITIALIZATION
// ============================================

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("Connected to MySQL database!");

  const allTables = [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS contacts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      message TEXT NOT NULL,
      is_viewed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS web_data (
      id INT UNSIGNED NOT NULL DEFAULT 1,
      marqueeText TEXT DEFAULT NULL,
      phone VARCHAR(255) DEFAULT NULL,
      facebookLink VARCHAR(500) DEFAULT NULL,
      linkedinLink VARCHAR(500) DEFAULT NULL,
      twitterLink VARCHAR(500) DEFAULT NULL,
      youtubeLink VARCHAR(500) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      email VARCHAR(150) DEFAULT NULL,
      intro_Eng TEXT DEFAULT NULL,
      intro_Ban TEXT DEFAULT NULL,
      subtitle VARCHAR(500) DEFAULT NULL,
      intro_bg_type VARCHAR(50) DEFAULT NULL,
      intro_bg_url VARCHAR(500) DEFAULT NULL,
      ovr_photo VARCHAR(500) DEFAULT NULL,
      ovr_heading VARCHAR(255) DEFAULT NULL,
      ovr_text TEXT DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS news_and_events (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      details TEXT NOT NULL,
      image VARCHAR(1024) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS notice_board (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      file_path VARCHAR(1024) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS teachers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      position VARCHAR(200) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      email VARCHAR(150) DEFAULT NULL,
      qualification VARCHAR(255) DEFAULT NULL,
      department VARCHAR(150) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS staff (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      position VARCHAR(200) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS authority (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      position VARCHAR(200) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      order_index INT DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS counters (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      value INT NOT NULL DEFAULT 0,
      duration INT NOT NULL DEFAULT 1000,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS portfolio_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      imgSrc VARCHAR(500) NOT NULL,
      zoomTitle VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS videos (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) DEFAULT NULL,
      video_url VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS photos (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      url VARCHAR(1024) NOT NULL,
      title VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS about_page (
      id INT UNSIGNED NOT NULL,
      content TEXT DEFAULT NULL,
      photo VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS academic_data (
      id INT UNSIGNED NOT NULL,
      table_engineering TEXT DEFAULT NULL,
      table_textile TEXT DEFAULT NULL,
      heading_engineering TEXT DEFAULT NULL,
      heading_textile TEXT DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS department (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL UNIQUE,
      hero_image VARCHAR(500) DEFAULT NULL,
      overview TEXT DEFAULT NULL,
      curriculum TEXT DEFAULT NULL,
      chief_instructor VARCHAR(150) DEFAULT NULL,
      total_students VARCHAR(50) DEFAULT NULL,
      duration VARCHAR(50) DEFAULT NULL,
      qualification VARCHAR(150) DEFAULT NULL,
      fees VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS studentfeedback (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      department VARCHAR(150) DEFAULT NULL,
      semester VARCHAR(100) DEFAULT NULL,
      photo_path VARCHAR(500) DEFAULT NULL,
      accepted TINYINT(1) DEFAULT 0,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS parents_feedback (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      occupation VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      photo_path VARCHAR(500) DEFAULT NULL,
      approved TINYINT(1) DEFAULT 0,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS online_admissions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      full_name VARCHAR(120) NOT NULL,
      date_of_birth DATE NOT NULL,
      father_name VARCHAR(100) NOT NULL,
      mother_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      guardian_phone VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      gender VARCHAR(20) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      upojati VARCHAR(10) NOT NULL,
      freefighter VARCHAR(10) NOT NULL,
      course_id VARCHAR(100) NOT NULL,
      image VARCHAR(500) DEFAULT NULL,
      exam_id VARCHAR(50) NOT NULL,
      pass_year INT NOT NULL,
      devition VARCHAR(100) NOT NULL,
      board VARCHAR(100) NOT NULL,
      b_roll VARCHAR(50) NOT NULL,
      r_number VARCHAR(50) NOT NULL,
      gpa FLOAT NOT NULL,
      transaction_amount FLOAT NOT NULL,
      btransaction_id VARCHAR(100) NOT NULL,
      transaction_reference VARCHAR(150) NOT NULL,
      is_Clicked TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS admission_instraction (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      content LONGTEXT,
      phone VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR(64) PRIMARY KEY,
      image VARCHAR(800) DEFAULT NULL,
      durationSeconds INT DEFAULT 5,
      active TINYINT(1) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS google_reviews (
      review_id VARCHAR(150) PRIMARY KEY,
      reviewer_name VARCHAR(200) DEFAULT NULL,
      reviewer_profile_photo VARCHAR(800) DEFAULT '',
      star_rating INT DEFAULT 0,
      comment TEXT,
      create_time DATETIME DEFAULT NULL,
      owner_reply TEXT DEFAULT NULL,
      owner_reply_time DATETIME DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];

  let completed = 0;
  const total = allTables.length;
  allTables.forEach((sql, idx) => {
    connection.query(sql, (createErr) => {
      if (createErr) {
        console.error(`Error ensuring table [${idx + 1}/${total}]:`, createErr.message);
      } else {
        debugLog(`Ensured table [${idx + 1}/${total}]`);
      }
      completed++;
      if (completed === total) {
        console.log('All core tables ensured.');

        executeQuery("INSERT IGNORE INTO web_data (id) VALUES (1)", [], () => {});
        executeQuery("INSERT IGNORE INTO about_page (id, content) VALUES (1, ''), (2, ''), (3, ''), (4, ''), (5, '')", [], () => {});
        executeQuery("INSERT IGNORE INTO academic_data (id) VALUES (1), (2), (3), (4)", [], () => {});

        executeQuery("SELECT COUNT(*) AS cnt FROM admin_users", [], (cntErr, rows) => {
          if (!cntErr && rows && rows[0] && rows[0].cnt === 0) {
            bcrypt.hash('admin123', 10).then((defaultHash) => {
              executeQuery("INSERT INTO admin_users (username, password) VALUES (?, ?)", ['admin', defaultHash], (insErr) => {
                if (!insErr) {
                  if (isDev) {
                    console.log('[DEV] Default admin user created (username: admin, password: admin123). Please change immediately!');
                  } else {
                    console.log('[WARN] Default admin user created. Please change default credentials immediately via Account Settings.');
                  }
                }
              });
            }).catch(() => {});
          }
        });

        connection.query("SHOW COLUMNS FROM admission_instraction LIKE 'phone'", (colErr, colResults) => {
          if (!colErr && (!colResults || colResults.length === 0)) {
            connection.query("ALTER TABLE admission_instraction ADD COLUMN phone VARCHAR(255) DEFAULT NULL", () => {});
          }
          connection.release();
        });
      }
    });
  });
});

ensureWebDataIntroBgColumns((err) => {
  if (err) {
    console.error('Error ensuring intro background columns exist:', err);
  } else {
    console.log('Ensured intro background columns exist.');
  }
});

const ensureStudentFeedbackOrderIndex = (callback) => {
  executeQuery("SHOW COLUMNS FROM studentfeedback LIKE 'order_index'", [], (err, results) => {
    if (err) return callback(err);
    if (results && results.length > 0) return callback(null);
    executeQuery("ALTER TABLE studentfeedback ADD COLUMN order_index INT NOT NULL DEFAULT 0", [], callback);
  });
};

const ensureParentsFeedbackOrderIndex = (callback) => {
  executeQuery("SHOW COLUMNS FROM parents_feedback LIKE 'order_index'", [], (err, results) => {
    if (err) return callback(err);
    if (results && results.length > 0) return callback(null);
    executeQuery("ALTER TABLE parents_feedback ADD COLUMN order_index INT NOT NULL DEFAULT 0", [], callback);
  });
};

ensureStudentFeedbackOrderIndex((err) => {
  if (err) console.error('Error ensuring studentfeedback order_index column:', err);
  else console.log('Ensured studentfeedback order_index column exists.');
});

ensureParentsFeedbackOrderIndex((err) => {
  if (err) console.error('Error ensuring parents_feedback order_index column:', err);
  else console.log('Ensured parents_feedback order_index column exists.');
});

setInterval(() => {
  executeQuery("SELECT 1", [], () => {});
}, 10 * 60 * 1000);

// ============================================
// GOOGLE REVIEWS
// ============================================

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function syncGoogleReviews() {
  try {
    const accountId = process.env.GOOGLE_ACCOUNT_ID;
    const locationId = process.env.GOOGLE_LOCATION_ID;
    if (!accountId || !locationId) {
      console.warn('Google account/location ID not configured; skipping reviews sync.');
      return;
    }
    const res = await oauth2Client.request({
      url: `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
    });
    const reviews = (res && res.data && res.data.reviews) ? res.data.reviews : [];
    for (let review of reviews) {
      const reviewId = review.reviewId || null;
      const reviewerName = review.reviewer && review.reviewer.displayName ? review.reviewer.displayName : null;
      const profilePhoto = review.reviewer && review.reviewer.profilePhotoUrl ? review.reviewer.profilePhotoUrl : '';
      const starRating = review.starRating === 'FIVE' ? 5 : review.starRating === 'FOUR' ? 4 : review.starRating === 'THREE' ? 3 : review.starRating === 'TWO' ? 2 : 1;
      const comment = review.comment || '';
      const createTime = review.createTime ? new Date(review.createTime) : new Date();
      const ownerReply = review.reviewReply ? review.reviewReply.comment : null;
      const ownerReplyTime = review.reviewReply && review.reviewReply.updateTime ? new Date(review.reviewReply.updateTime) : null;
      const query = `
        INSERT INTO google_reviews (review_id, reviewer_name, reviewer_profile_photo, star_rating, comment, create_time, owner_reply, owner_reply_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        reviewer_name = VALUES(reviewer_name),
        reviewer_profile_photo = VALUES(reviewer_profile_photo),
        star_rating = VALUES(star_rating),
        comment = VALUES(comment),
        owner_reply = VALUES(owner_reply),
        owner_reply_time = VALUES(owner_reply_time)
      `;
      await new Promise((resolve) => {
        db.query(query, [reviewId, reviewerName, profilePhoto, starRating, comment, createTime, ownerReply, ownerReplyTime], (err) => {
          if (err) console.error('DB insert/update error for google_reviews:', err);
          resolve();
        });
      });
    }
    console.log('Google Reviews successfully synced with MySQL Database.');
  } catch (error) {
    console.error('Error syncing Google reviews:', error);
  }
}

cron.schedule('0 0 * * *', () => {
  console.log('Running daily Google Reviews sync...');
  syncGoogleReviews();
});

// ============================================
// STATIC FILES - FIXED: Better path handling
// ============================================

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOAD_ROOT, {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// ============================================
// BANNERS API - FIXED: Using normalized path
// ============================================

const ensureBannersTable = () => {
  const createTable = `CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(64) PRIMARY KEY,
    image VARCHAR(800) DEFAULT NULL,
    durationSeconds INT DEFAULT 5,
    active TINYINT(1) DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  executeQuery(createTable, [], (err) => {
    if (err) return console.error('Failed ensuring banners table:', err);
    executeQuery('SELECT COUNT(*) AS cnt FROM banners', [], (countErr, rows) => {
      if (countErr) return console.error('Banners count check failed:', countErr);
      const cnt = rows && rows[0] && rows[0].cnt ? rows[0].cnt : 0;
      if (cnt > 0) return;
      try {
        if (!fs.existsSync(path.join(__dirname, 'banners.json'))) return;
        const raw = fs.readFileSync(path.join(__dirname, 'banners.json'), 'utf8');
        const items = JSON.parse(raw || '[]');
        if (!Array.isArray(items) || items.length === 0) return;
        const insert = 'INSERT INTO banners (id,image,durationSeconds,active,createdAt) VALUES ?';
        const values = items.map(b => [String(b.id || Date.now()), b.image || null, parseInt(b.durationSeconds || 5, 10), b.active ? 1 : 0, b.createdAt ? new Date(b.createdAt) : new Date()]);
        if (values.length) executeQuery(insert, [values], (insErr) => { if (insErr) console.error('Failed to migrate banners.json:', insErr); else console.log('Migrated banners.json into banners table'); });
      } catch (e) { console.error('Failed to migrate banners.json:', e); }
    });
  });
};

ensureBannersTable();

app.get('/api/banners', (req, res) => {
  executeQuery('SELECT id,image,durationSeconds,active,DATE_FORMAT(createdAt, "%Y-%m-%dT%H:%i:%sZ") AS createdAt FROM banners ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      console.error('GET /api/banners error:', err);
      return res.status(500).json({ error: 'Failed to load banners' });
    }
    const normalized = (rows || []).map((r) => ({ ...r, active: r.active === 1 || r.active === true }));
    return res.status(200).json(normalized);
  });
});

app.post('/api/banners', verifyToken, (req, res, next) => {
  req.overrideUploadFolder = 'banner';
  next();
}, uploadPublicImage.single('image'), (req, res) => {
  try {
    const imagePath = getUploadPublicPath(req.file);
    if (!imagePath) {
      return res.status(400).json({ error: 'Failed to process uploaded image' });
    }
    const durationSeconds = parseInt(req.body.durationSeconds, 10) || 5;
    const active = (req.body.active === 'true' || req.body.active === true || req.body.active === '1') ? 1 : 0;
    executeQuery('SELECT COUNT(*) AS cnt FROM banners', [], (cntErr, cntRows) => {
      if (cntErr) {
        console.error('POST /api/banners count error:', cntErr);
        return res.status(500).json({ error: 'Failed to validate banner limit' });
      }
      const currentCount = (cntRows && cntRows[0] && cntRows[0].cnt) ? cntRows[0].cnt : 0;
      if (currentCount >= 2) {
        return res.status(400).json({ error: 'Maximum of 2 banners allowed. Please delete one before adding a new banner.' });
      }
      const id = String(Date.now());
      const createdAt = new Date();
      const insert = 'INSERT INTO banners (id,image,durationSeconds,active,createdAt) VALUES (?, ?, ?, ?, ?)';
      executeQuery(insert, [id, imagePath, durationSeconds, active, createdAt], (err) => {
        if (err) {
          console.error('POST /api/banners DB error:', err);
          return res.status(500).json({ error: 'Failed to save banner' });
        }
        return res.status(201).json({ 
          message: 'Banner saved', 
          banner: { 
            id, 
            image: imagePath, 
            durationSeconds, 
            active: active === 1, 
            createdAt: createdAt.toISOString() 
          } 
        });
      });
    });
  } catch (err) {
    console.error('POST /api/banners error:', err);
    res.status(500).json({ error: 'Failed to save banner' });
  }
});

app.put('/api/banners/:id', verifyToken, (req, res) => {
  try {
    const id = req.params.id;
    const updates = [];
    const params = [];
    if (req.body.durationSeconds !== undefined) { updates.push('durationSeconds = ?'); params.push(parseInt(req.body.durationSeconds, 10) || 5); }
    if (req.body.active !== undefined) { updates.push('active = ?'); params.push((req.body.active === true || req.body.active === 'true' || req.body.active === '1') ? 1 : 0); }
    if (req.body.image !== undefined) { 
      const normalizedImage = normalizeDbPath(req.body.image);
      updates.push('image = ?'); 
      params.push(normalizedImage); 
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    const sql = `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`;
    executeQuery(sql, params, (err) => {
      if (err) {
        console.error('PUT /api/banners error:', err);
        return res.status(500).json({ error: 'Failed to update banner' });
      }
      executeQuery('SELECT id,image,durationSeconds,active,DATE_FORMAT(createdAt, "%Y-%m-%dT%H:%i:%sZ") AS createdAt FROM banners WHERE id = ?', [id], (sErr, rows) => {
        if (sErr) { console.error('Failed to fetch updated banner:', sErr); return res.status(200).json({ message: 'Banner updated' }); }
        const banner = rows && rows[0] ? { ...rows[0], active: rows[0].active === 1 || rows[0].active === true } : null;
        return res.status(200).json({ message: 'Banner updated', banner });
      });
    });
  } catch (err) {
    console.error('PUT /api/banners error:', err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

app.delete('/api/banners/:id', verifyToken, (req, res) => {
  try {
    const id = req.params.id;
    executeQuery('SELECT image FROM banners WHERE id = ?', [id], (err, rows) => {
      if (err) { console.error('DELETE /api/banners select error:', err); return res.status(500).json({ error: 'Failed to delete banner' }); }
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Banner not found' });
      const img = rows[0].image;
      executeQuery('DELETE FROM banners WHERE id = ?', [id], (delErr) => {
        if (delErr) { console.error('DELETE /api/banners delete error:', delErr); return res.status(500).json({ error: 'Failed to delete banner' }); }
        if (img) safeUnlink(img);
        return res.status(200).json({ message: 'Banner deleted' });
      });
    });
  } catch (err) {
    console.error('DELETE /api/banners error:', err);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// ============================================
// GOOGLE REVIEWS ROUTES
// ============================================

app.get('/api/google-reviews', (req, res) => {
  db.query('SELECT * FROM google_reviews ORDER BY create_time DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database fetch error' });
    res.status(200).json(rows);
  });
});

app.get('/api/sync-reviews-manual', verifyToken, async (req, res) => {
  try {
    await syncGoogleReviews();
    res.status(200).json({ message: 'Sync trigger completed.' });
  } catch (syncErr) {
    console.error('Manual sync error:', syncErr);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ============================================
// AUTH ROUTES - FIXED: Better token handling
// ============================================

app.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required!" });
  }
  const sql = "SELECT * FROM admin_users WHERE username = ?";
  executeQuery(sql, [username], async (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(401).json({ error: "Auth table missing." });
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results && results.length > 0) {
      const user = results[0];
      const dbPassword = (user.password || "");
      const isEncrypted = dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2a$");
      let isMatch = false;
      try {
        if (isEncrypted) {
          isMatch = await bcrypt.compare(password, dbPassword);
        } else {
          isMatch = safeCompare(password, dbPassword);
        }
        if (isMatch) {
          const payload = { id: user.id, username: user.username };
          // Use longer expiration for better user experience
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
          console.log('Login successful for user:', username);
          return res.status(200).json({
            message: "Login successful!",
            token
          });
        }
      } catch (error) {
        console.error("Bcrypt compare error:", error);
        return res.status(500).json({ error: "Authentication error" });
      }
    }
    res.status(401).json({ error: "Invalid username or password!" });
  });
});

// FIXED: Better logout with token cleanup
app.post('/logout', verifyToken, (req, res) => {
  const auth = req.headers['authorization'] || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(400).json({ message: 'No valid token provided' });
  }
  const token = parts[1];
  try {
    const payload = jwt.decode(token);
    const exp = payload && payload.exp ? payload.exp * 1000 : Date.now() + 3600 * 1000;
    tokenBlacklist.set(token, exp);
    // Clean up blacklist after token expires
    setTimeout(() => {
      tokenBlacklist.delete(token);
      // Save updated blacklist to file
      try {
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Object.fromEntries(tokenBlacklist)), 'utf8');
      } catch (e) {}
    }, Math.max(0, exp - Date.now()));
    
    // Save blacklist to file
    try {
      fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(Object.fromEntries(tokenBlacklist)), 'utf8');
    } catch (e) {}
    
    return res.json({ message: 'Logged out successfully' });
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(400).json({ message: 'Invalid token' });
  }
});

app.post("/change-password", verifyToken, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Username, current password and new password are required." });
  }
  const sql = "SELECT * FROM admin_users WHERE username = ?";
  executeQuery(sql, [username], async (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(401).json({ message: "Auth table missing." });
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ message: "User not found." });
    }
    const user = results[0];
    const isEncrypted = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
    let isMatch = false;
    try {
      if (isEncrypted) {
        isMatch = await bcrypt.compare(currentPassword, user.password);
      } else {
        isMatch = safeCompare(currentPassword, user.password);
      }
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dynamicUpdate("admin_users", { password: hashedPassword }, "username = ?", [username], res);
    } catch (error) {
      console.error("Bcrypt error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});

app.post("/change-username", verifyToken, (req, res) => {
  const { currentUsername, newUsername } = req.body;
  if (!currentUsername || !newUsername) {
    return res.status(400).json({ message: "Current username and new username are required." });
  }
  const sql = "SELECT * FROM admin_users WHERE username = ?";
  executeQuery(sql, [currentUsername], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(401).json({ message: "Auth table missing." });
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Current username is incorrect." });
    }
    dynamicUpdate("admin_users", { username: newUsername }, "username = ?", [currentUsername], res);
  });
});

// ============================================
// CONTACT FORM ROUTES
// ============================================

app.post("/submit-form", publicFormLimiter, contactFormValidation, validationErrorHandler, (req, res) => {
  const { name, email, phone, message } = req.body;
  const cleanPhone = (phone && String(phone).trim()) ? phone : null;
  const sql = "INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)";
  executeQuery(sql, [name, email, cleanPhone, message], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to save data to the database." });
    }
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const backupEmail = process.env.BACKUP_ADMIN_EMAIL;
      const adminHtml = getContactAdminEmailTemplate({
        name,
        email,
        phone: cleanPhone,
        message,
      });
      if (adminEmail) {
        sendEmail(adminEmail, "New Contact Message Received!", adminHtml).catch(e => console.error('Admin email error:', e));
      }
      if (backupEmail) {
        sendEmail(backupEmail, "New Contact Message Received!", adminHtml).catch(e => console.error('Backup admin email error:', e));
      }
    } catch (emailErr) {
      console.error("Contact form email sending error:", emailErr);
    }
    res.status(200).json({ message: "Form data successfully saved!", id: result && result.insertId ? result.insertId : null });
  });
});

app.get("/get-messages", verifyToken, (req, res) => {
  const sql = "SELECT * FROM contacts";
  executeQuery(sql, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error("Database query error:", err);
      return res.status(500).send("Failed to fetch messages from the database.");
    }
    res.status(200).json(results);
  });
});

app.delete("/delete-message/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM contacts WHERE id = ?";
  executeQuery(sql, [id], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing, nothing to delete." });
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to delete message." });
    }
    if (result && result.affectedRows === 0) {
      return res.status(404).json({ message: "Message not found." });
    }
    res.status(200).json({ message: "Message deleted successfully." });
  });
});

app.get("/get-message-details/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid message ID." });
  }
  const sql = "SELECT * FROM contacts WHERE id = ?";
  executeQuery(sql, [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(404).json({ message: "Table not found." });
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to fetch message details." });
    }
    if (results && results.length === 0) {
      return res.status(404).json({ message: "Message not found." });
    }
    res.status(200).json(results[0]);
  });
});

app.put("/update-message-status/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { is_viewed } = req.body;
  dynamicUpdate("contacts", { is_viewed }, "id = ?", [id], res);
});

app.get("/unread-messages", verifyToken, (req, res) => {
  executeQuery("SELECT COUNT(*) AS unreadCount FROM contacts WHERE is_viewed = 0", [], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ unreadCount: 0 });
      console.error('DB error (unread messages):', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ unreadCount: (result && result[0] ? result[0].unreadCount : 0) });
  });
});

// ============================================
// CONTACT DETAILS ROUTES
// ============================================

app.get('/contact', (req, res) => {
  const query = 'SELECT address, email, phone FROM web_data LIMIT 1';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      res.status(500).send({ error: 'Error fetching contact details' });
    } else {
      res.json(results && results[0] ? results[0] : {});
    }
  });
});

app.put('/contact', verifyToken, (req, res) => {
  const { address, email, phone } = req.body;
  dynamicUpdate('web_data', { address, email, phone }, '1', [], res);
});

app.get(['/contact-details', '/contact-info', '/contactDetails'], (req, res) => {
  executeQuery('SELECT address, email, phone FROM web_data WHERE id = ?', [1], (err, results) => {
    if (err) {
      console.error('Error fetching contact details (alias):', err);
      return res.status(200).json({ address: '', email: '', phone: '' });
    }
    const row = results && results[0] ? results[0] : { address: '', email: '', phone: '' };
    res.status(200).json({
      address: row.address || '',
      email: row.email || '',
      phone: row.phone || ''
    });
  });
});

app.put(['/contact-details', '/contact-info', '/contactDetails'], verifyToken, (req, res) => {
  const { address, email, phone } = req.body || {};
  const updates = {};
  if (address !== undefined) updates.address = address;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }
  dynamicUpdate('web_data', updates, 'id = ?', [1], res);
});

// ============================================
// SOCIAL LINKS ROUTES
// ============================================

app.get(['/social-links', '/socialLinks'], (req, res) => {
  executeQuery('SELECT facebookLink, youtubeLink, linkedinLink, twitterLink FROM web_data WHERE id = ?', [1], (err, results) => {
    if (err) {
      console.error('Error fetching social links (alias):', err);
      return res.status(200).json({ facebookLink: '', youtubeLink: '', linkedinLink: '', twitterLink: '' });
    }
    const row = results && results[0] ? results[0] : {};
    res.status(200).json({
      facebookLink: row.facebookLink || '',
      youtubeLink: row.youtubeLink || '',
      linkedinLink: row.linkedinLink || '',
      twitterLink: row.twitterLink || ''
    });
  });
});

app.put(['/social-links', '/socialLinks'], verifyToken, (req, res) => {
  const { facebookLink, youtubeLink, linkedinLink, twitterLink } = req.body || {};
  const updates = {};
  if (facebookLink !== undefined) updates.facebookLink = facebookLink;
  if (youtubeLink !== undefined) updates.youtubeLink = youtubeLink;
  if (linkedinLink !== undefined) updates.linkedinLink = linkedinLink;
  if (twitterLink !== undefined) updates.twitterLink = twitterLink;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }
  dynamicUpdate('web_data', updates, 'id = ?', [1], res);
});

// ============================================
// NEWS AND EVENTS ROUTES
// ============================================

app.get("/news", (req, res) => {
  const sql = "SELECT * FROM news_and_events ORDER BY created_at DESC";
  executeQuery(sql, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to fetch news." });
    }
    res.status(200).json(results);
  });
});

app.post("/news", verifyToken, upload.single('image'), (req, res) => {
  const { title, details } = req.body;
  const image = getUploadPublicPath(req.file);
  if (!title || !details || !image) {
    return res.status(400).json({ message: "Title, details, and image are required." });
  }
  const sql = "INSERT INTO news_and_events (title, details, image) VALUES (?, ?, ?)";
  executeQuery(sql, [title, details, image], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to save news." });
    }
    const newNewsId = result.insertId;
    executeQuery("SELECT * FROM news_and_events WHERE id = ?", [newNewsId], (fetchErr, newNews) => {
      if (fetchErr) {
        return res.status(500).json({ message: "Failed to fetch newly created news." });
      }
      res.status(201).json(newNews[0]);
    });
  });
});

app.put("/news/:id", verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, details } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (details !== undefined) updates.details = details;
  if (req.file) {
    const newImage = getUploadPublicPath(req.file);
    executeQuery('SELECT image FROM news_and_events WHERE id = ?', [id], (err, results) => {
      const oldImagePath = (!err && results && results.length > 0) ? results[0].image : null;
      updates.image = newImage;
      dynamicUpdate('news_and_events', updates, 'id = ?', [id], res, () => {
        if (oldImagePath) deleteUploadedFile(oldImagePath);
      });
    });
  } else {
    dynamicUpdate('news_and_events', updates, 'id = ?', [id], res);
  }
});

app.delete("/news/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT image FROM news_and_events WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: "Error fetching news item." });
    }
    const imagePath = (results && results.length > 0 ? results[0].image : null);
    const sql = "DELETE FROM news_and_events WHERE id = ?";
    executeQuery(sql, [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error("Database query error:", deleteErr);
        return res.status(500).json({ message: "Failed to delete news." });
      }
      if (result && result.affectedRows > 0) {
        if (imagePath) safeUnlink(imagePath);
        res.status(200).json({ message: "News deleted successfully." });
      } else {
        res.status(404).json({ message: "News not found." });
      }
    });
  });
});

// ============================================
// WEB DATA ROUTES
// ============================================

app.post("/save-content", verifyToken, (req, res) => {
  const { marqueeText, phoneNumbers, facebookLink, linkedinLink, twitterLink, youtubeLink } = req.body;
  const query = `
    INSERT INTO web_data (marqueeText, phone, facebookLink, linkedinLink, twitterLink, youtubeLink)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    marqueeText = VALUES(marqueeText),
    phone = VALUES(phone),
    facebookLink = VALUES(facebookLink),
    linkedinLink = VALUES(linkedinLink),
    twitterLink = VALUES(twitterLink),
    youtubeLink = VALUES(youtubeLink);
  `;
  executeQuery(
    query,
    [marqueeText, phoneNumbers, facebookLink, linkedinLink, twitterLink, youtubeLink],
    (err, result) => {
      if (err) {
        console.error("Error saving content:", err);
        res.status(500).send("Error saving content");
      } else {
        res.status(200).send("Content saved successfully");
      }
    }
  );
});

app.get('/get-web-data', (req, res) => {
  const query = "SELECT `id`, `marqueeText`, `phone` AS `phoneNumbers`, `facebookLink`, `linkedinLink`, `twitterLink`, `youtubeLink` FROM `web_data`";
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json((results && results[0]) || {});
  });
});

app.post('/update-web-data', verifyToken, (req, res) => {
  const { marqueeText, phoneNumbers, facebookLink, linkedinLink, twitterLink, youtubeLink } = req.body;
  const updates = {};
  if (marqueeText !== undefined) updates.marqueeText = marqueeText;
  if (phoneNumbers !== undefined) updates.phone = phoneNumbers;
  if (facebookLink !== undefined) updates.facebookLink = facebookLink;
  if (linkedinLink !== undefined) updates.linkedinLink = linkedinLink;
  if (twitterLink !== undefined) updates.twitterLink = twitterLink;
  if (youtubeLink !== undefined) updates.youtubeLink = youtubeLink;
  dynamicUpdate('web_data', updates, 'id = ?', [1], res);
});

// ============================================
// INTRO DATA ROUTES
// ============================================

app.get('/getIntroData', (req, res) => {
  const query = 'SELECT `intro_Eng`, `intro_Ban`, `subtitle`, `intro_bg_type`, `intro_bg_url` FROM `web_data` WHERE 1';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(404).json({ error: 'Table not found' });
      console.error('Error fetching data from DB:', err);
      res.status(500).json({ error: 'Failed to fetch data' });
      return;
    }
    if (results && results.length > 0) {
      const { intro_Eng, intro_Ban, subtitle, intro_bg_type, intro_bg_url } = results[0];
      res.json({ intro_Eng, intro_Ban, subtitle, intro_bg_type, intro_bg_url });
    } else {
      res.status(404).json({ error: 'No data found' });
    }
  });
});

app.post('/updateIntroData', verifyToken, (req, res) => {
  const { intro_Eng, intro_Ban, subtitle, intro_bg_type, intro_bg_url } = req.body;
  const updates = {};
  if (intro_Eng !== undefined) updates.intro_Eng = intro_Eng;
  if (intro_Ban !== undefined) updates.intro_Ban = intro_Ban;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (intro_bg_type !== undefined) updates.intro_bg_type = intro_bg_type;
  if (intro_bg_url !== undefined) updates.intro_bg_url = intro_bg_url;
  dynamicUpdate('web_data', updates, 'id = ?', [1], res);
});

const forceIntroUpload = (req, res, next) => {
  req.overrideUploadFolder = 'Intro';
  next();
};

app.post('/uploadIntroBackground', verifyToken, forceIntroUpload, upload.single('background'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const backgroundPath = getUploadPublicPath(req.file);
  const type = req.file.mimetype && req.file.mimetype.startsWith('video/') ? 'video' : 'photo';

  res.status(200).json({ message: 'File uploaded', intro_bg_url: backgroundPath, intro_bg_type: type });

  executeQuery('SELECT intro_bg_url FROM web_data WHERE id = ?', [1], (selectErr, results) => {
    const oldPath = (!selectErr && results && results.length > 0) ? results[0].intro_bg_url : null;
    const sql = `UPDATE web_data SET intro_bg_type = ?, intro_bg_url = ? WHERE id = ?`;
    executeQuery(sql, [type, backgroundPath, 1], (updateErr) => {
      if (updateErr) {
        console.error('Failed to update intro background in DB (async):', updateErr);
        return;
      }
      if (oldPath && oldPath !== backgroundPath) {
        deleteUploadedFile(oldPath);
      }
      console.log('Intro background DB updated (async)');
    });
  });
});

// ============================================
// OVERVIEW ROUTES
// ============================================

app.get('/overview', (req, res) => {
  const query = 'SELECT id, ovr_photo, ovr_heading, ovr_text FROM web_data WHERE 1';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching data from the database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.put('/overview', verifyToken, (req, res) => {
  const { ovr_heading, ovr_text, ovr_photo } = req.body;
  const updates = {};
  if (ovr_heading !== undefined) updates.ovr_heading = ovr_heading;
  if (ovr_text !== undefined) updates.ovr_text = ovr_text;
  if (ovr_photo !== undefined) updates.ovr_photo = ovr_photo;
  dynamicUpdate('web_data', updates, 'id = ?', [1], res);
});

app.post('/upload-photo', verifyToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photoPath = getUploadPublicPath(req.file);
  executeQuery('SELECT ovr_photo FROM web_data WHERE 1', [], (err, results) => {
    const oldPhoto = (!err && results && results.length > 0) ? results[0].ovr_photo : null;
    dynamicUpdate('web_data', { ovr_photo: photoPath }, '1', [], res, () => {
      if (oldPhoto && oldPhoto !== photoPath) deleteUploadedFile(oldPhoto);
    });
  });
});

// ============================================
// COUNTERS ROUTES
// ============================================

app.get('/counters', (req, res) => {
  const query = "SELECT * FROM counters ORDER BY order_index ASC";
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = 'SELECT * FROM counters ORDER BY id ASC';
        return executeQuery(fallbackQuery, [], (fallbackErr, fallbackResults) => {
          if (fallbackErr) {
            if (fallbackErr.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
            return res.status(500).json({ error: 'Database query failed' });
          }
          res.json(fallbackResults || []);
        });
      }
      console.error('Counters fetch error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results || []);
  });
});

app.post('/counters', verifyToken, (req, res) => {
  const { title, value, duration } = req.body;
  if (!title || value === undefined) {
    return res.status(400).json({ error: 'Title and value are required' });
  }
  const insertCounter = () => {
    executeQuery('SELECT MAX(order_index) as maxOrder FROM counters', [], (err, results) => {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = 'INSERT INTO counters (title, value, duration) VALUES (?, ?, ?)';
        return executeQuery(fallbackQuery, [title, value, duration || 1000], (insertErr, result) => {
          if (insertErr) {
            console.error('Counter insert fallback error:', insertErr);
            return res.status(500).json({ error: 'Failed to add counter' });
          }
          res.status(201).json({ id: result.insertId, title, value, duration: duration || 1000 });
        });
      }
      if (err) {
        console.error('Counter max order query error:', err);
        return res.status(500).json({ error: 'Failed to add counter' });
      }
      const nextOrder = (results && results[0] && results[0].maxOrder !== null) ? results[0].maxOrder + 1 : 0;
      const query = 'INSERT INTO counters (title, value, duration, order_index) VALUES (?, ?, ?, ?)';
      executeQuery(query, [title, value, duration || 1000, nextOrder], (insertErr, result) => {
        if (insertErr) {
          console.error('Counter insert error:', insertErr);
          return res.status(500).json({ error: 'Failed to add counter' });
        }
        res.status(201).json({ id: result.insertId, title, value, duration: duration || 1000, order_index: nextOrder });
      });
    });
  };
  executeQuery('SELECT 1 FROM counters LIMIT 1', [], (tableErr) => {
    if (tableErr && tableErr.code === 'ER_NO_SUCH_TABLE') {
      const createTableQuery = `
        CREATE TABLE counters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          value INT NOT NULL DEFAULT 0,
          duration INT NOT NULL DEFAULT 1000,
          order_index INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `;
      executeQuery(createTableQuery, [], (createErr) => {
        if (createErr) {
          console.error('Counter table creation error:', createErr);
          return res.status(500).json({ error: 'Failed to setup counters' });
        }
        insertCounter();
      });
    } else if (tableErr) {
      console.error('Counter table check error:', tableErr);
      return res.status(500).json({ error: 'Failed to add counter' });
    } else {
      insertCounter();
    }
  });
});

app.put('/counters/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { title, value, duration } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (value !== undefined) updates.value = value;
  if (duration !== undefined) updates.duration = duration;
  dynamicUpdate('counters', updates, 'id = ?', [id], res);
});

app.delete('/counters/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('DELETE FROM counters WHERE id = ?', [id], (err, result) => {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({ message: 'Counter deleted (table does not exist)' });
    }
    if (err) {
      console.error('Counter delete error:', err);
      return res.status(500).json({ error: 'Failed to delete counter' });
    }
    res.json({ message: 'Counter deleted successfully' });
  });
});

app.put('/counters-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE counters SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE')) {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Reordered successfully' }))
    .catch(err => {
      console.error('Counter reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder' });
    });
});

// ============================================
// PORTFOLIO ROUTES
// ============================================

app.get('/portfolio', (req, res) => {
  executeQuery('SELECT * FROM portfolio_items', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results || []);
  });
});

app.post('/portfolio', verifyToken, upload.single('image'), (req, res) => {
  const { title, description, zoomTitle } = req.body;
  const imgSrc = getUploadPublicPath(req.file);
  if (!imgSrc) {
    return res.status(400).json({ message: 'Image is required' });
  }
  const query = 'INSERT INTO portfolio_items (title, description, imgSrc, zoomTitle) VALUES (?, ?, ?, ?)';
  executeQuery(query, [title, description, imgSrc, zoomTitle], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error saving portfolio item' });
    }
    res.status(200).json({ message: 'Portfolio item added successfully', imgSrc });
  });
});

app.put('/portfolio/:id', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, zoomTitle } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (zoomTitle !== undefined) updates.zoomTitle = zoomTitle;
  if (req.file) {
    const newImgSrc = getUploadPublicPath(req.file);
    executeQuery('SELECT imgSrc FROM portfolio_items WHERE id = ?', [id], (err, results) => {
      const oldImagePath = (!err && results && results.length > 0) ? results[0].imgSrc : null;
      updates.imgSrc = newImgSrc;
      dynamicUpdate('portfolio_items', updates, 'id = ?', [id], res, () => {
        if (oldImagePath) deleteUploadedFile(oldImagePath);
      });
    });
  } else {
    dynamicUpdate('portfolio_items', updates, 'id = ?', [id], res);
  }
});

app.delete('/portfolio/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT imgSrc FROM portfolio_items WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ error: 'Error fetching item details' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const imagePath = results[0].imgSrc;
    executeQuery('DELETE FROM portfolio_items WHERE id = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        return res.status(500).json({ error: 'Failed to delete portfolio item' });
      }
      if (result && result.affectedRows > 0) {
        if (imagePath) safeUnlink(imagePath);
        res.json({ message: 'Portfolio item deleted successfully' });
      } else {
        res.status(404).json({ error: 'Item not found' });
      }
    });
  });
});

// ============================================
// VIDEOS ROUTES
// ============================================

app.get('/videos', (req, res) => {
  const query = 'SELECT * FROM videos';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

app.post('/videos', verifyToken, upload.single('video'), (req, res) => {
  const { title } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded." });
  }
  const videoUrl = getUploadPublicPath(req.file);
  const query = 'INSERT INTO videos (title, video_url) VALUES (?, ?)';
  executeQuery(query, [title, videoUrl], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json({ id: (result ? result.insertId : null), title, video_url: videoUrl });
  });
});

app.put('/videos/:id', verifyToken, (req, res) => {
  const { title } = req.body;
  const videoId = req.params.id;
  dynamicUpdate('videos', { title }, 'id = ?', [videoId], res);
});

app.delete('/videos/:id', verifyToken, (req, res) => {
  const videoId = req.params.id;
  const query = 'DELETE FROM videos WHERE id = ?';
  executeQuery(query, [videoId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json({ message: 'Video deleted successfully' });
  });
});

// ============================================
// PHOTOS ROUTES
// ============================================

app.get("/photos", (req, res) => {
  const query = "SELECT * FROM photos";
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error("Error fetching photos:", err);
      return res.status(500).json({ message: "Error fetching photos" });
    }
    res.status(200).json(results || []);
  });
});

app.post("/upload", verifyToken, upload.single("photo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    const imageUrl = getUploadPublicPath(req.file);
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 255) : "";

    ensurePhotosTitleColumn((columnErr) => {
      if (columnErr) {
        console.error("Error ensuring photos title column:", columnErr);
        return res.status(500).json({ message: "Error saving photo metadata" });
      }

      const query = title ? "INSERT INTO photos (url, title) VALUES (?, ?)" : "INSERT INTO photos (url) VALUES (?)";
      const values = title ? [imageUrl, title] : [imageUrl];

      executeQuery(query, values, (err, result) => {
        if (err) {
          console.error("Error inserting photo:", err);
          return res.status(500).json({ message: "Error saving photo" });
        }
        res.status(200).json({ id: (result ? result.insertId : null), url: imageUrl, title });
      });
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Error uploading photo" });
  }
});

app.put("/photos/:id", verifyToken, (req, res) => {
  const photoId = req.params.id;

  const handleTitleUpdate = (filePath, title) => {
    if (!title && !filePath) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const updateParts = [];
    const params = [];

    if (filePath) {
      updateParts.push("url = ?");
      params.push(filePath);
    }
    if (title) {
      updateParts.push("title = ?");
      params.push(title);
    }
    params.push(photoId);

    const updatePhoto = () => {
      const query = `UPDATE photos SET ${updateParts.join(", ")} WHERE id = ?`;
      executeQuery(query, params, (err, result) => {
        if (err) {
          console.error("Error updating photo:", err);
          return res.status(500).json({ message: "Error updating photo" });
        }
        res.status(200).json({ message: "Photo updated successfully" });
      });
    };

    if (title) {
      ensurePhotosTitleColumn((columnErr) => {
        if (columnErr) {
          console.error("Error ensuring photos title column:", columnErr);
          return res.status(500).json({ message: "Error updating photo" });
        }
        updatePhoto();
      });
    } else {
      updatePhoto();
    }
  };

  const formDataUpload = upload.single("photo");

  formDataUpload(req, res, (err) => {
    if (err && err.code !== 'LIMIT_PART_COUNT' && err.code !== 'LIMIT_FILE_SIZE' && err.message !== 'Unexpected field') {
      console.error("Upload error:", err);
      return res.status(400).json({ message: "File upload error" });
    }

    try {
      let title = req.body?.title;

      if (typeof title === 'string') {
        title = title.trim().slice(0, 255);
      } else if (typeof title !== 'string') {
        title = null;
      }

      const filePath = getUploadPublicPath(req.file);
      handleTitleUpdate(filePath, title);
    } catch (error) {
      console.error("Photo update error:", error);
      res.status(500).json({ message: "Error updating photo" });
    }
  });
});

app.delete("/photos/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT url FROM photos WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error("Error fetching photo details:", err);
      return res.status(500).json({ message: "Error fetching photo details" });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Photo not found" });
    }
    const imagePath = results[0].url;
    const query = "DELETE FROM photos WHERE id = ?";
    executeQuery(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting photo from DB:", err);
        return res.status(500).json({ message: "Error deleting photo from database" });
      }
      if (imagePath) safeUnlink(imagePath);
      res.status(200).json({ message: "Photo deleted successfully" });
    });
  });
});

// ============================================
// TEACHERS ROUTES
// ============================================

app.get('/teachers', (req, res) => {
  const query = 'SELECT `id`, `name`, `position`, `image`, `email`, `qualification`, `department`, `order_index` FROM `teachers` ORDER BY `order_index` ASC, `id` ASC';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching teachers:', err);
      res.status(500).json({ error: 'Failed to fetch teachers' });
    } else {
      res.json(results || []);
    }
  });
});

app.post('/teachers', verifyToken, upload.single('image'), (req, res) => {
  const { name, position, email, qualification } = req.body;
  let imageUrl = 'https://via.placeholder.com/150';
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT MAX(order_index) as maxOrder FROM teachers', [], (err, results) => {
    const nextOrder = (results && results[0] && results[0].maxOrder !== null) ? results[0].maxOrder + 1 : 0;
    const query = 'INSERT INTO `teachers`(`name`, `position`, `image`, `email`, `qualification`, `department`, `order_index`) VALUES (?, ?, ?, ?, ?, ?, ?)';
    executeQuery(query, [name, position, imageUrl, email || null, qualification || null, (req.body.department || null), nextOrder], (err, result) => {
      if (err) {
        console.error('Error adding teacher:', err);
        res.status(500).json({ error: 'Failed to add teacher' });
      } else {
        res.json({ id: (result ? result.insertId : null), name, position, image: imageUrl, email: email || null, qualification: qualification || null, order_index: nextOrder });
      }
    });
  });
});

app.delete('/teachers/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  debugLog('Delete teacher request for ID:', id);
  executeQuery('SELECT image FROM teachers WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching teacher for delete:', err);
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ error: 'Error fetching teacher details' });
    }
    if (!results || results.length === 0) {
      console.log('Teacher not found for ID:', id);
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const imagePath = results[0].image;
    executeQuery('DELETE FROM teachers WHERE id = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error('Error deleting teacher:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete teacher' });
      }
      if (result && result.affectedRows > 0) {
        console.log('Teacher deleted successfully, ID:', id);
        if (imagePath) safeUnlink(imagePath);
        res.json({ message: 'Teacher deleted successfully' });
      } else {
        console.log('No teacher affected by delete, ID:', id);
        res.status(404).json({ error: 'Teacher not found' });
      }
    });
  });
});

app.put('/teachers/:id', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, position, email, qualification, department } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (position !== undefined) updates.position = position;
  if (email !== undefined) updates.email = email;
  if (qualification !== undefined) updates.qualification = qualification;
  if (department !== undefined) updates.department = department;
  if (req.file) {
    const newImage = getUploadPublicPath(req.file);
    executeQuery('SELECT image FROM teachers WHERE id = ?', [id], (err, rows) => {
      const oldImagePath = (!err && rows && rows.length > 0) ? rows[0].image : null;
      updates.image = newImage;
      dynamicUpdate('teachers', updates, 'id = ?', [id], res, () => {
        if (oldImagePath && !oldImagePath.startsWith('http')) deleteUploadedFile(oldImagePath);
      });
    });
  } else {
    dynamicUpdate('teachers', updates, 'id = ?', [id], res);
  }
});

// ============================================
// STAFF ROUTES
// ============================================

app.get('/staff', (req, res) => {
  const query = 'SELECT id, name, position, image, order_index FROM staff ORDER BY order_index ASC, id ASC';
  executeQuery(query, [], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      res.status(500).json({ error: 'Failed to fetch staff data' });
    } else {
      res.json(result);
    }
  });
});

app.post('/staff', verifyToken, upload.single('image'), (req, res) => {
  const { name, position } = req.body;
  let imageUrl = 'https://via.placeholder.com/150';
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT MAX(order_index) as maxOrder FROM staff', [], (err, results) => {
    const nextOrder = (results && results[0] && results[0].maxOrder !== null) ? results[0].maxOrder + 1 : 0;
    const query = 'INSERT INTO staff (name, position, image, order_index) VALUES (?, ?, ?, ?)';
    executeQuery(query, [name, position, imageUrl, nextOrder], (err, result) => {
      if (err) {
        console.error('Error adding staff:', err);
        return res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json({ id: (result ? result.insertId : null), name, position, image: imageUrl, order_index: nextOrder });
      }
    });
  });
});

app.put('/staff/:id/image', verifyToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  const newImageUrl = getUploadPublicPath(req.file);
  executeQuery('SELECT image FROM staff WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error('Error fetching old image path:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const oldImagePath = (results && results.length > 0 ? results[0].image : null);
    dynamicUpdate('staff', { image: newImageUrl }, 'id = ?', [id], res, () => {
      if (oldImagePath && !oldImagePath.startsWith('http')) deleteUploadedFile(oldImagePath);
    });
  });
});

app.put('/staff/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;
  if (!name || !position) {
    return res.status(400).json({ error: 'Name and position are required' });
  }
  dynamicUpdate('staff', { name, position }, 'id = ?', [id], res);
});

app.delete('/staff/:id', verifyToken, (req, res) => {
  const staffId = req.params.id;
  console.log('Delete staff request for ID:', staffId);
  executeQuery('SELECT image FROM staff WHERE id = ?', [staffId], (err, results) => {
    if (err) {
      console.error('Error fetching staff for delete:', err);
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ error: 'Error fetching staff details' });
    }
    if (!results || results.length === 0) {
      console.log('Staff not found for ID:', staffId);
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const imagePath = results[0].image;
    executeQuery('DELETE FROM staff WHERE id = ?', [staffId], (deleteErr, result) => {
      if (deleteErr) {
        console.error('Error deleting staff:', deleteErr);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (result && result.affectedRows > 0) {
        console.log('Staff deleted successfully, ID:', staffId);
        if (imagePath) deleteUploadedFile(imagePath);
        res.status(200).json({ message: 'Staff removed successfully' });
      } else {
        console.log('No staff affected by delete, ID:', staffId);
        res.status(404).json({ message: 'Staff member not found' });
      }
    });
  });
});

app.put('/teachers-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE teachers SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Teachers reordered successfully' }))
    .catch(err => {
      console.error('Teachers reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder teachers' });
    });
});

app.put('/staff-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE staff SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Staff reordered successfully' }))
    .catch(err => {
      console.error('Staff reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder staff' });
    });
});

app.put('/student-feedback-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE studentfeedback SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Student feedback reordered successfully' }))
    .catch(err => {
      console.error('Student feedback reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder student feedback' });
    });
});

app.put('/parents-feedback-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE parents_feedback SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Parents feedback reordered successfully' }))
    .catch(err => {
      console.error('Parents feedback reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder parents feedback' });
    });
});

// ============================================
// AUTHORITY ROUTES
// ============================================

app.get('/authority', (req, res) => {
  let query = 'SELECT `id`, `name`, `position`, `image`, `order_index` FROM `authority` ORDER BY `order_index` ASC';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = 'SELECT `id`, `name`, `position`, `image` FROM `authority` ORDER BY `id` ASC';
        return executeQuery(fallbackQuery, [], (fallbackErr, fallbackResults) => {
          if (fallbackErr) {
            if (fallbackErr.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
            return res.status(500).json({ error: 'Database query error' });
          }
          res.json(fallbackResults || []);
        });
      }
      console.error('Authority fetch error:', err);
      res.status(500).json({ error: 'Database query error' });
    } else {
      res.json(results || []);
    }
  });
});

app.get('/authority/:id', (req, res) => {
  const { id } = req.params;
  let query = 'SELECT `id`, `name`, `position`, `image`, `bio` FROM `authority` WHERE `id` = ? LIMIT 1';
  executeQuery(query, [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = 'SELECT `id`, `name`, `position`, `image` FROM `authority` WHERE `id` = ? LIMIT 1';
        return executeQuery(fallbackQuery, [id], (fallbackErr, fallbackResults) => {
          if (fallbackErr) return res.status(500).json({ error: 'Database query error' });
          if (!fallbackResults || fallbackResults.length === 0) return res.status(404).json({ error: 'Authority member not found' });
          res.json(fallbackResults[0]);
        });
      }
      console.error('Authority detail fetch error:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    if (!results || results.length === 0) return res.status(404).json({ error: 'Authority member not found' });
    res.json(results[0]);
  });
});

app.post('/authority', verifyToken, upload.single('image'), (req, res) => {
  const { name, position } = req.body;
  const image = getUploadPublicPath(req.file);
  if (!name || !position) {
    return res.status(400).json({ error: 'Name and position are required' });
  }
  executeQuery('SELECT MAX(order_index) as maxOrder FROM authority', [], (err, results) => {
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      const fallbackQuery = 'INSERT INTO authority (name, position, image) VALUES (?, ?, ?)';
      return executeQuery(fallbackQuery, [name, position, image], (insertErr, result) => {
        if (insertErr) {
          console.error('Authority insert fallback error:', insertErr);
          return res.status(500).json({ error: 'Failed to add authority' });
        }
        res.status(201).json({ id: result.insertId, name, position, image });
      });
    }
    const nextOrder = (results && results[0] && results[0].maxOrder !== null) ? results[0].maxOrder + 1 : 0;
    const query = 'INSERT INTO authority (name, position, image, order_index) VALUES (?, ?, ?, ?)';
    executeQuery(query, [name, position, image, nextOrder], (insertErr, result) => {
      if (insertErr) {
        console.error('Authority insert error:', insertErr);
        return res.status(500).json({ error: 'Failed to add authority' });
      }
      res.status(201).json({ id: result.insertId, name, position, image, order_index: nextOrder });
    });
  });
});

app.delete('/authority/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT image FROM authority WHERE id = ?', [id], (err, results) => {
    const imagePath = results && results[0] ? results[0].image : null;
    executeQuery('DELETE FROM authority WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to delete authority' });
      if (imagePath) deleteUploadedFile(imagePath);
      res.json({ message: 'Authority deleted successfully' });
    });
  });
});

// Update authority details (name, position, bio)
app.put('/authority/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, position, bio } = req.body;
  
  if (!name || !position) {
    return res.status(400).json({ error: 'Name and position are required' });
  }

  const query = 'UPDATE authority SET name = ?, position = ?, bio = ? WHERE id = ?';
  executeQuery(query, [name, position, bio || '', id], (err, result) => {
    if (err) {
      console.error('Authority update error:', err);
      return res.status(500).json({ error: 'Failed to update authority' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Authority member not found' });
    }
    res.json({ message: 'Authority updated successfully', id, name, position, bio });
  });
});

// Update authority photo
app.post('/authority/:id/photo', verifyToken, upload.single('photo'), (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No photo file provided' });
  }

  const newImagePath = getUploadPublicPath(req.file);

  // Get the old image path to delete it
  executeQuery('SELECT image FROM authority WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch authority' });
    }

    const oldImagePath = results && results[0] ? results[0].image : null;

    // Update the database with new image path
    executeQuery('UPDATE authority SET image = ? WHERE id = ?', [newImagePath, id], (updateErr, result) => {
      if (updateErr) {
        console.error('Authority photo update error:', updateErr);
        return res.status(500).json({ error: 'Failed to update photo' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Authority member not found' });
      }

      // Delete old image if it exists
      if (oldImagePath) {
        deleteUploadedFile(oldImagePath);
      }

      res.json({ message: 'Photo updated successfully', image: newImagePath });
    });
  });
});

app.put('/authority-reorder', verifyToken, (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Invalid orders format' });
  const promises = orders.map(item => {
    return new Promise((resolve, reject) => {
      executeQuery('UPDATE authority SET order_index = ? WHERE id = ?', [item.order_index, item.id], (err) => {
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          resolve();
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Reordered successfully' }))
    .catch(err => {
      console.error('Authority reorder error:', err);
      res.status(500).json({ error: 'Failed to reorder' });
    });
});

// ============================================
// ABOUT PAGE ROUTES
// ============================================

// Concession
app.get('/concession', (req, res) => {
  const query = 'SELECT id, content, photo FROM about_page WHERE id = 1';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching concession data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Concession data not found' });
    }
  });
});

app.put('/concession', verifyToken, upload.single('photo'), (req, res) => {
  const { content } = req.body;
  let photoUrl = req.body.photo;
  if (req.file) {
    photoUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT photo FROM about_page WHERE id = 1', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old photo' });
    }
    const oldPhoto = (results && results.length > 0 ? results[0].photo : null);
    dynamicUpdate('about_page', { content, photo: photoUrl }, 'id = 1', [], res, () => {
      if (req.file && oldPhoto) deleteUploadedFile(oldPhoto);
    });
  });
});

// Profile
app.get('/profile', (req, res) => {
  const query = 'SELECT id, content, photo FROM about_page WHERE id = 2';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching profile data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Profile data not found' });
    }
  });
});

app.put('/profile', verifyToken, upload.single('photo'), (req, res) => {
  const { content } = req.body;
  let photoUrl = req.body.photo;
  if (req.file) {
    photoUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT photo FROM about_page WHERE id = 2', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old photo' });
    }
    const oldPhoto = (results && results.length > 0 ? results[0].photo : null);
    dynamicUpdate('about_page', { content, photo: photoUrl }, 'id = 2', [], res, () => {
      if (req.file && oldPhoto) deleteUploadedFile(oldPhoto);
    });
  });
});

// Our Dream
app.get('/our-dream', (req, res) => {
  const query = 'SELECT id, content, photo FROM about_page WHERE id = 3';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Our Dream data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Our Dream data not found' });
    }
  });
});

app.put('/our-dream', verifyToken, upload.single('photo'), (req, res) => {
  const { content } = req.body;
  let photoUrl = req.body.photo;
  if (req.file) {
    photoUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT photo FROM about_page WHERE id = 3', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old photo' });
    }
    const oldPhoto = (results && results.length > 0 ? results[0].photo : null);
    dynamicUpdate('about_page', { content, photo: photoUrl }, 'id = 3', [], res, () => {
      if (req.file && oldPhoto) deleteUploadedFile(oldPhoto);
    });
  });
});

// Controlling Authority
app.get('/controlling-authority', (req, res) => {
  const query = 'SELECT id, content, photo FROM about_page WHERE id = 4';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Controlling Authority data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Controlling Authority data not found' });
    }
  });
});

app.put('/controlling-authority', verifyToken, upload.single('photo'), (req, res) => {
  const { content } = req.body;
  let photoUrl = req.body.photo;
  if (req.file) {
    photoUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT photo FROM about_page WHERE id = 4', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old photo' });
    }
    const oldPhoto = (results && results.length > 0 ? results[0].photo : null);
    dynamicUpdate('about_page', { content, photo: photoUrl }, 'id = 4', [], res, () => {
      if (req.file && oldPhoto) deleteUploadedFile(oldPhoto);
    });
  });
});

// Short Brief
app.get('/short-brief', (req, res) => {
  const query = 'SELECT id, content, photo FROM about_page WHERE id = 5';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Short Brief data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Short Brief data not found' });
    }
  });
});

app.put('/short-brief', verifyToken, upload.single('photo'), (req, res) => {
  const { content } = req.body;
  let photoUrl = req.body.photo;
  if (req.file) {
    photoUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT photo FROM about_page WHERE id = 5', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old photo' });
    }
    const oldPhoto = (results && results.length > 0 ? results[0].photo : null);
    dynamicUpdate('about_page', { content, photo: photoUrl }, 'id = 5', [], res, () => {
      if (req.file && oldPhoto) deleteUploadedFile(oldPhoto);
    });
  });
});

// ============================================
// ACADEMIC DATA ROUTES
// ============================================

app.get('/fetch', (req, res) => {
  const query = 'SELECT id, table_engineering, table_textile, heading_engineering, heading_textile, image FROM academic_data WHERE id = 1';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Dhaka Campus data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Dhaka Campus data not found' });
    }
  });
});

app.post('/save', verifyToken, upload.single('image'), (req, res) => {
  const { table_engineering, table_textile, heading_engineering, heading_textile, id } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT image FROM academic_data WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old image' });
    }
    const oldImage = (results && results.length > 0 ? results[0].image : null);
    const updates = { table_engineering, table_textile, heading_engineering, heading_textile, image: imageUrl };
    dynamicUpdate('academic_data', updates, 'id = ?', [id], res, () => {
      if (req.file && oldImage) deleteUploadedFile(oldImage);
    });
  });
});

app.get('/fetchFaridpur', (req, res) => {
  const query = 'SELECT id, table_engineering, table_textile, heading_engineering, heading_textile, image FROM academic_data WHERE id = 2';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Faridpur Campus data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Faridpur Campus data not found' });
    }
  });
});

app.post('/saveFaridpur', verifyToken, upload.single('image'), (req, res) => {
  const { table_engineering, table_textile, heading_engineering, heading_textile, id } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT image FROM academic_data WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old image' });
    }
    const oldImage = (results && results.length > 0 ? results[0].image : null);
    const updates = { table_engineering, table_textile, heading_engineering, heading_textile, image: imageUrl };
    dynamicUpdate('academic_data', updates, 'id = ?', [id], res, () => {
      if (req.file && oldImage) deleteUploadedFile(oldImage);
    });
  });
});

app.get('/fetchManikganj', (req, res) => {
  const query = 'SELECT id, table_engineering, table_textile, heading_engineering, heading_textile, image FROM academic_data WHERE id = 3';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Manikganj Campus data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Manikganj Campus data not found' });
    }
  });
});

app.post('/saveManikganj', verifyToken, upload.single('image'), (req, res) => {
  const { table_engineering, table_textile, heading_engineering, heading_textile, id } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT image FROM academic_data WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old image' });
    }
    const oldImage = (results && results.length > 0 ? results[0].image : null);
    const updates = { table_engineering, table_textile, heading_engineering, heading_textile, image: imageUrl };
    dynamicUpdate('academic_data', updates, 'id = ?', [id], res, () => {
      if (req.file && oldImage) deleteUploadedFile(oldImage);
    });
  });
});

app.get('/fetchSonargaon', (req, res) => {
  const query = 'SELECT id, table_engineering, table_textile, heading_engineering, heading_textile, image FROM academic_data WHERE id = 4';
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({});
      console.error('Error fetching Sonargaon Campus data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results && results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'Sonargaon Campus data not found' });
    }
  });
});

app.post('/saveSonargaon', verifyToken, upload.single('image'), (req, res) => {
  const { table_engineering, table_textile, heading_engineering, heading_textile, id } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = getUploadPublicPath(req.file);
  }
  executeQuery('SELECT image FROM academic_data WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      return res.status(500).json({ message: 'Error fetching old image' });
    }
    const oldImage = (results && results.length > 0 ? results[0].image : null);
    const updates = { table_engineering, table_textile, heading_engineering, heading_textile, image: imageUrl };
    dynamicUpdate('academic_data', updates, 'id = ?', [id], res, () => {
      if (req.file && oldImage) deleteUploadedFile(oldImage);
    });
  });
});

// ============================================
// NOTICE BOARD ROUTES
// ============================================

app.post("/upload-notice", verifyToken, upload.single("files"), (req, res) => {
  debugLog("Upload request received", req.file ? req.file.originalname : 'no-file');
  const { title } = req.body;
  if (!req.file || !title) {
    console.log("Missing file or title");
    return res.status(400).json({ message: "Title and file are required." });
  }
  const sql = "INSERT INTO notice_board (title, file_path) VALUES (?, ?)";
  executeQuery(sql, [title, getUploadPublicPath(req.file)], (err) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Failed to upload notice." });
    }
    console.log("Notice uploaded successfully!");
    res.status(200).json({ message: "Notice uploaded successfully!" });
  });
});

app.get('/get-notices', (req, res) => {
  const sql = "SELECT * FROM notice_board";
  executeQuery(sql, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      return res.status(500).json({ message: "Error fetching notices." });
    }
    res.status(200).json((results || []).map(notice => ({
      ...notice,
      fileUrl: notice.file_path
    })));
  });
});

app.delete("/delete-notice/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  console.log("Delete request received for notice ID:", id);
  if (!id || isNaN(id)) {
    console.log("Invalid notice ID");
    return res.status(400).json({ message: "Invalid notice ID." });
  }
  executeQuery('SELECT file_path FROM notice_board WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error("Error fetching notice:", err);
      return res.status(500).json({ message: "Error fetching notice." });
    }
    if (!results || results.length === 0) {
      console.log("Notice not found in database");
      return res.status(404).json({ message: "Notice not found." });
    }
    const filePath = results[0].file_path;
    console.log("File path to delete:", filePath);
    executeQuery("DELETE FROM notice_board WHERE id = ?", [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error("Failed to delete notice:", deleteErr);
        return res.status(500).json({ message: "Failed to delete notice." });
      }
      if (result && result.affectedRows > 0) {
        console.log("Notice deleted from database, affected rows:", result.affectedRows);
        if (filePath) {
          safeUnlink(filePath);
        }
        console.log("Notice deletion completed successfully");
        res.status(200).json({ message: "Notice deleted successfully." });
      } else {
        console.log("No rows affected, notice not found");
        res.status(404).json({ message: "Notice not found." });
      }
    });
  });
});

app.put("/edit-notice/:id", verifyToken, upload.single("file"), (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const file = req.file;
  let newFilePath = null;
  if (file) {
    newFilePath = getUploadPublicPath(file);
  }
  executeQuery('SELECT file_path FROM notice_board WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error('Error fetching old file path:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    const oldFilePath = (results && results.length > 0 ? results[0].file_path : null);
    const finalFilePath = newFilePath || oldFilePath;
    dynamicUpdate('notice_board', { title, file_path: finalFilePath }, 'id = ?', [id], res, () => {
      if (file && oldFilePath) deleteUploadedFile(oldFilePath);
    });
  });
});

app.get('/download-notice/:id', (req, res) => {
  const noticeId = Number(req.params.id);
  if (!noticeId) {
    return res.status(400).json({ message: 'Invalid notice id.' });
  }

  executeQuery('SELECT id, title, file_path FROM notice_board WHERE id = ?', [noticeId], (err, results) => {
    if (err) {
      console.error('Failed to fetch notice for download:', err);
      return res.status(500).json({ message: 'Failed to fetch notice.' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Notice not found.' });
    }

    const notice = results[0];
    const filePath = notice.file_path || '';
    const safePath = resolveUploadServerPath(filePath);

    if (!safePath) {
      return res.status(404).json({ message: 'Notice file not found.' });
    }

    const downloadName = buildNoticeDownloadName(notice.title, filePath);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return res.download(safePath, downloadName, (sendErr) => {
      if (sendErr) {
        console.error('Notice file download failed:', sendErr);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to download file.' });
        }
      }
    });
  });
});

// ============================================
// DEPARTMENT ROUTES
// ============================================

function getDeptNameByCode(code) {
  const mapping = {
    cmt: 'Computer Science and Technology',
    civ: 'Civil Technology',
    elec: 'Electrical Technology',
    electro: 'Electronics Technology',
    mec: 'Mechanical Technology',
    textile: 'Textile Technology',
    arc: 'Architecture Technology',
    auto: 'Automobile Technology',
    food: 'Food Technology'
  };
  return mapping[code.toLowerCase()] || '';
}

function findDepartmentByCode(deptCode, cb) {
  const code = deptCode.toLowerCase();
  const canonicalName = getDeptNameByCode(code);

  const aliasKeywords = {
    cmt: ['%computer%', '%cmt%', '%comput%'],
    civ: ['%civil%'],
    elec: ['%electrical%'],
    electro: ['%electronics%', '%electro%'],
    mec: ['%mechanical%', '%mec%'],
    textile: ['%textile%'],
    arc: ['%architecture%', '%arc%'],
    auto: ['%automobile%', '%auto%'],
    food: ['%food%']
  };

  const keywords = aliasKeywords[code] || [];
  const allNames = [canonicalName, ...keywords].filter(Boolean);

  const whereClauses = allNames.map(() => 'name LIKE ?').join(' OR ');
  const query = `SELECT * FROM department WHERE ${whereClauses} LIMIT 1`;
  executeQuery(query, allNames, (err, results) => {
    if (err) return cb(err, null);
    if (results && results.length > 0) return cb(null, results[0]);
    executeQuery('SELECT * FROM department LIMIT 1', [], (err2, results2) => {
      if (err2) return cb(err2, null);
      if (results2 && results2.length > 0) return cb(null, null);
      cb(null, null);
    });
  });
}

app.get(['/department', '/departments'], (req, res) => {
  executeQuery('SELECT * FROM department', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching departments:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

app.get('/:deptCode(cmt|civ|elec|electro|mec|textile|arc|auto|food)department', (req, res) => {
  const deptCode = req.params.deptCode;
  findDepartmentByCode(deptCode, (err, deptRow) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json(null);
      console.error(`Error fetching department ${deptCode}:`, err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (deptRow) {
      res.json(deptRow);
    } else {
      res.status(200).json(null);
    }
  });
});

app.put('/:deptCode(cmt|civ|elec|electro|mec|textile|arc|auto|food)update-content', verifyToken, (req, res) => {
  const deptCode = req.params.deptCode;
  const { overview, curriculum } = req.body;
  findDepartmentByCode(deptCode, (err, deptRow) => {
    if (err) {
      console.error(`Error fetching dept for update-content ${deptCode}:`, err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deptRow) {
      return res.status(404).json({ error: 'Department not found' });
    }
    dynamicUpdate('department', { overview, curriculum }, 'id = ?', [deptRow.id], res);
  });
});

app.put('/:deptCode(cmt|civ|elec|electro|mec|textile|arc|auto|food)update-course-overview', verifyToken, (req, res) => {
  const deptCode = req.params.deptCode;
  const { chiefInstructor, totalStudents, duration, qualification, fees } = req.body;
  const updates = {
    chief_instructor: chiefInstructor,
    total_students: totalStudents,
    duration: duration,
    qualification: qualification,
    fees: fees
  };
  findDepartmentByCode(deptCode, (err, deptRow) => {
    if (err) {
      console.error(`Error fetching dept for course-overview ${deptCode}:`, err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deptRow) {
      return res.status(404).json({ error: 'Department not found' });
    }
    dynamicUpdate('department', updates, 'id = ?', [deptRow.id], res);
  });
});

app.post('/:deptCode(cmt|civ|elec|electro|mec|textile|arc|auto|food)upload-hero-image', verifyToken, upload.single('heroImage'), (req, res) => {
  const deptCode = req.params.deptCode;
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = getUploadPublicPath(req.file);
  findDepartmentByCode(deptCode, (err, deptRow) => {
    if (err) {
      console.error(`Error fetching dept for hero image ${deptCode}:`, err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!deptRow) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const oldImage = deptRow.hero_image || null;
    dynamicUpdate('department', { hero_image: imageUrl }, 'id = ?', [deptRow.id], res, () => {
      if (oldImage) deleteUploadedFile(oldImage);
    });
  });
});

// ============================================
// STUDENT FEEDBACK ROUTES
// ============================================

app.get('/get-feedback', (req, res) => {
  executeQuery('SELECT * FROM studentfeedback WHERE accepted = 1 ORDER BY order_index ASC, id ASC', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching student feedback:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

app.get('/get-feedbacks', verifyToken, (req, res) => {
  executeQuery('SELECT * FROM studentfeedback ORDER BY order_index ASC, id ASC', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching all student feedbacks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

app.post('/feedback', wrapMulter(upload.single('photo')), studentFeedbackValidation, validationErrorHandler, (req, res) => {
  try {
    const { name, message, type, department, semester } = req.body;
    const photo_path = getUploadPublicPath(req.file);
    const cleanDepartment = (department && String(department).trim()) || null;
    const cleanSemester = (semester && String(semester).trim()) || null;
    executeQuery('SELECT MAX(order_index) as maxOrder FROM studentfeedback', [], (maxErr, maxResults) => {
      if (maxErr) {
        console.error('Error getting max order_index for student feedback:', maxErr);
        return res.status(500).json({ error: 'Failed to submit feedback' });
      }
      const nextOrder = (maxResults && maxResults[0] && maxResults[0].maxOrder !== null) ? maxResults[0].maxOrder + 1 : 0;
      const query = 'INSERT INTO studentfeedback (name, message, type, department, semester, photo_path, accepted, order_index) VALUES (?, ?, ?, ?, ?, ?, 0, ?)';
      executeQuery(query, [name, message, type, cleanDepartment, cleanSemester, photo_path, nextOrder], (err, result) => {
        if (err) {
          console.error('Error inserting student feedback:', err);
          return res.status(500).json({ error: 'Failed to submit feedback' });
        }
        try {
          const adminEmail = process.env.ADMIN_EMAIL;
          const backupEmail = process.env.BACKUP_ADMIN_EMAIL;
          const adminHtml = getStudentFeedbackAdminEmailTemplate({
            name,
            message,
            type,
            department: cleanDepartment,
            semester: cleanSemester,
          });
          if (adminEmail) {
            sendEmail(adminEmail, `New ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Student'} Feedback Received!`, adminHtml).catch(e => console.error('Admin email error:', e));
          }
          if (backupEmail) {
            sendEmail(backupEmail, `New ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Student'} Feedback Received!`, adminHtml).catch(e => console.error('Backup admin email error:', e));
          }
        } catch (emailErr) {
          console.error("Student feedback email sending error:", emailErr);
        }
        res.status(201).json({ message: 'Feedback submitted successfully', id: result.insertId });
      });
    });
  } catch (syncErr) {
    console.error('Sync error (student feedback):', syncErr);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

app.put('/accept-feedback/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  dynamicUpdate('studentfeedback', { accepted: 1 }, 'id = ?', [id], res);
});

app.delete('/delete-sfeedback/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT photo_path FROM studentfeedback WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error('Error fetching student feedback photo:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const photoPath = results && results[0] ? results[0].photo_path : null;
    executeQuery('DELETE FROM studentfeedback WHERE id = ?', [id], (delErr, result) => {
      if (delErr) {
        console.error('Error deleting student feedback:', delErr);
        return res.status(500).json({ error: 'Failed to delete feedback' });
      }
      if (result && result.affectedRows === 0) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      if (photoPath) safeUnlink(photoPath);
      res.status(200).json({ message: 'Student feedback deleted successfully' });
    });
  });
});

// ============================================
// PARENTS FEEDBACK ROUTES
// ============================================

app.get('/approved-parents-feedbacks', (req, res) => {
  executeQuery('SELECT * FROM parents_feedback WHERE approved = 1 ORDER BY order_index ASC, id ASC', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching approved parents feedback:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

app.get('/all-parents-feedbacks', verifyToken, (req, res) => {
  executeQuery('SELECT * FROM parents_feedback ORDER BY order_index ASC, id ASC', [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error('Error fetching all parents feedbacks:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results || []);
  });
});

app.post('/add-parents-feedback', wrapMulter(upload.single('photo')), parentsFeedbackValidation, validationErrorHandler, (req, res) => {
  try {
    const rawName = req.body && req.body.name ? req.body.name : '';
    const rawOccupation = req.body && req.body.occupation ? req.body.occupation : '';
    const rawMessage = req.body && req.body.message ? req.body.message : '';

    const cleanName = String(rawName).trim() || '';
    const cleanOccupation = String(rawOccupation).trim() || '';
    const cleanMessage = String(rawMessage).trim() || '';

    const photo_path = req.file ? getUploadPublicPath(req.file) : null;

    console.log('[add-parents-feedback] incoming:', {
      nameLen: cleanName.length,
      occLen: cleanOccupation.length,
      msgLen: cleanMessage.length,
      hasPhoto: !!photo_path,
      photo: photo_path || null,
    });

    executeQuery('SELECT MAX(order_index) as maxOrder FROM parents_feedback', [], (maxErr, maxResults) => {
      if (maxErr) {
        console.error('[add-parents-feedback] Error getting max order_index:', maxErr);
        return res.status(500).json({
          error: 'Failed to submit feedback. Please try again.',
          details: maxErr.code || 'DB_ERROR',
        });
      }
      const nextOrder = (maxResults && maxResults[0] && maxResults[0].maxOrder !== null) ? maxResults[0].maxOrder + 1 : 0;
      const query = 'INSERT INTO parents_feedback (name, occupation, message, photo_path, approved, order_index) VALUES (?, ?, ?, ?, 0, ?)';
      executeQuery(query, [cleanName, cleanOccupation, cleanMessage, photo_path, nextOrder], (err, result) => {
        if (err) {
          console.error('[add-parents-feedback] DB INSERT ERROR:', err.code, err.message, err.sqlMessage || '');
          return res.status(500).json({
            error: 'Failed to submit feedback. Please try again.',
            details: err.code || 'DB_ERROR',
          });
        }
        console.log('[add-parents-feedback] success, inserted id:', result.insertId);
        try {
          const adminEmail = process.env.ADMIN_EMAIL;
          const backupEmail = process.env.BACKUP_ADMIN_EMAIL;
          const adminHtml = getParentsFeedbackAdminEmailTemplate({
            name: cleanName,
            occupation: cleanOccupation,
            message: cleanMessage,
          });
          if (adminEmail) {
            sendEmail(adminEmail, "New Parents Feedback Received!", adminHtml).catch(e => console.error('Admin email error:', e));
          }
          if (backupEmail) {
            sendEmail(backupEmail, "New Parents Feedback Received!", adminHtml).catch(e => console.error('Backup admin email error:', e));
          }
        } catch (emailErr) {
          console.error("Parents feedback email sending error:", emailErr);
        }
        res.status(201).json({ message: 'Feedback submitted successfully', id: result.insertId });
      });
    });
  } catch (syncErr) {
    console.error('[add-parents-feedback] SYNC ERROR:', syncErr && syncErr.message, syncErr && syncErr.stack);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
});

app.put('/approve-feedback/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  dynamicUpdate('parents_feedback', { approved: 1 }, 'id = ?', [id], res);
});

app.delete('/delete-feedback/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  executeQuery('SELECT photo_path FROM parents_feedback WHERE id = ?', [id], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ message: "Table missing." });
      console.error('Error fetching parents feedback photo:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const photoPath = results && results[0] ? results[0].photo_path : null;
    executeQuery('DELETE FROM parents_feedback WHERE id = ?', [id], (delErr, result) => {
      if (delErr) {
        console.error('Error deleting parents feedback:', delErr);
        return res.status(500).json({ error: 'Failed to delete feedback' });
      }
      if (result && result.affectedRows === 0) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      if (photoPath) safeUnlink(photoPath);
      res.status(200).json({ message: 'Parents feedback deleted successfully' });
    });
  });
});

// ============================================
// ADMISSION ROUTES
// ============================================

app.post("/submit-admission", submitAdmissionLimiter, wrapMulter(uploadPublicImage.single("image")), admissionValidation, validationErrorHandler, (req, res) => {
  const {
    full_name,
    date_of_birth,
    father_name,
    mother_name,
    email,
    phone,
    guardian_phone,
    address,
    gender,
    nationality,
    upojati,
    freefighter,
    course_id,
    exam_id,
    pass_year,
    devition,
    board,
    b_roll,
    r_number,
    gpa,
    transaction_amount,
    btransaction_id,
    transaction_reference,
  } = req.body;
  try {
    const imageUrl = getUploadPublicPath(req.file);
    const query = `
      INSERT INTO online_admissions (
        full_name, date_of_birth, father_name, mother_name, email, phone, guardian_phone,
        address, gender, nationality, upojati, freefighter, course_id, image, exam_id,
        pass_year, devition, board, b_roll, r_number, gpa, transaction_amount,
        btransaction_id, transaction_reference, is_Clicked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      full_name,
      date_of_birth,
      father_name,
      mother_name,
      email,
      phone,
      guardian_phone,
      address,
      gender,
      nationality,
      upojati,
      freefighter,
      course_id,
      imageUrl,
      exam_id,
      pass_year,
      devition,
      board,
      b_roll,
      r_number,
      gpa,
      transaction_amount,
      btransaction_id,
      transaction_reference,
      0,
    ];
    executeQuery(query, values, (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Failed to submit admission" });
      }
      try {
        console.log("Starting email process for:", email);
        if (email) {
          const studentHtml = getStudentEmailTemplate(full_name);
          sendEmail(email, "Admission Application Received - NPI", studentHtml).catch(e => console.error('Student email error:', e));
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        const backupEmail = process.env.BACKUP_ADMIN_EMAIL;
        const adminHtml = getAdminEmailTemplate({
          full_name,
          course_id,
          pass_year,
          phone,
          transaction_amount,
          btransaction_id,
          transaction_reference,
        });
        if (adminEmail) {
          sendEmail(adminEmail, "New Online Admission Received!", adminHtml).catch(e => console.error('Admin email error:', e));
        }
        sendEmail(backupEmail, "New Online Admission Received!", adminHtml).catch(e => console.error('Backup admin email error:', e));
      } catch (emailErr) {
        console.error("Email Sending Error Log:", emailErr);
      }
      res.status(200).json({ message: "Admission submitted successfully" });
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

app.get("/online-admissions", verifyToken, (req, res) => {
  const query = `
    SELECT
      id, full_name, date_of_birth, father_name, mother_name, email, phone,
      guardian_phone, address, gender, nationality, upojati, freefighter,
      course_id, image, exam_id, pass_year, devition, board, b_roll, r_number,
      gpa, transaction_amount, btransaction_id, transaction_reference, is_Clicked, created_at
    FROM online_admissions WHERE 1
  `;
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error("Error fetching admissions:", err);
      return res.status(500).json({ message: "Failed to fetch admissions" });
    }
    res.json(results || []);
  });
});

app.put("/update-admission-status/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { is_Clicked } = req.body;
  dynamicUpdate("online_admissions", { is_Clicked }, "id = ?", [id], res);
});

app.get("/online-admissions-status", verifyToken, (req, res) => {
  const query = `
    SELECT id, is_Clicked
    FROM online_admissions
  `;
  executeQuery(query, [], (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
      console.error("Error fetching admission statuses:", err);
      return res.status(500).json({ error: "Failed to fetch admission statuses." });
    }
    res.json(results);
  });
});

app.get("/unread-admissions", verifyToken, (req, res) => {
  executeQuery("SELECT COUNT(*) AS unreadCount FROM online_admissions WHERE is_Clicked = 0", [], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ unreadCount: 0 });
      console.error('DB error (unread admissions):', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ unreadCount: (result && result[0] ? result[0].unreadCount : 0) });
  });
});

app.post('/upload-image', verifyToken, upload.single('image'), (req, res) => {
  const imagePath = getUploadPublicPath(req.file);
  if (imagePath) {
    executeQuery('INSERT INTO online_admissions (image) VALUES (?)', [imagePath], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Error saving image path');
      }
      res.status(200).send({ imagePath });
    });
  } else {
    res.status(400).send('No file uploaded');
  }
});

app.get('/get-latest-image', (req, res) => {
  executeQuery('SELECT image FROM online_admissions ORDER BY created_at DESC LIMIT 1', [], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json({ image_path: null });
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Error fetching image' });
    }
    const image = result && result[0] ? result[0].image : null;
    res.status(200).json({ image_path: image });
  });
});

// ============================================
// ADMISSION INSTRUCTION ROUTES
// ============================================

app.post('/update-instruction/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { content, phone } = req.body;
  dynamicUpdate('admission_instraction', { content, phone }, 'id = ?', [id], res);
});

app.post('/add-instruction', verifyToken, (req, res) => {
  const { content, phone } = req.body;
  const query = 'INSERT INTO admission_instraction (content, phone) VALUES (?, ?)';
  executeQuery(query, [content, phone], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ message: 'Error adding data' });
    }
    res.status(200).json({ message: 'Instruction and Phone added successfully', id: result.insertId });
  });
});

app.get('/get-instruction', (req, res) => {
  const query = 'SELECT id, content, phone FROM admission_instraction LIMIT 1';
  executeQuery(query, [], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return res.status(404).json({ message: 'Table not found' });
      console.error('Fetch error:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (result && result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).json({ message: 'No instruction found' });
    }
  });
});

// ============================================
// UNREAD COUNTS
// ============================================

app.get('/unread-counts', verifyToken, (req, res) => {
  Promise.all([
    new Promise((resolve) => {
      executeQuery("SELECT COUNT(*) AS cnt FROM contacts WHERE is_viewed = 0", [], (err, r) => {
        resolve(!err && r && r[0] ? r[0].cnt : 0);
      });
    }),
    new Promise((resolve) => {
      executeQuery("SELECT COUNT(*) AS cnt FROM online_admissions WHERE is_Clicked = 0", [], (err, r) => {
        resolve(!err && r && r[0] ? r[0].cnt : 0);
      });
    }),
    new Promise((resolve) => {
      executeQuery("SELECT COUNT(*) AS cnt FROM studentfeedback WHERE accepted = 0", [], (err, r) => {
        resolve(!err && r && r[0] ? r[0].cnt : 0);
      });
    }),
    new Promise((resolve) => {
      executeQuery("SELECT COUNT(*) AS cnt FROM parents_feedback WHERE approved = 0", [], (err, r) => {
        resolve(!err && r && r[0] ? r[0].cnt : 0);
      });
    })
  ]).then(([messages, admissions, sFeedback, pFeedback]) => {
    res.status(200).json({
      unreadMessages: messages,
      unreadAdmissions: admissions,
      unreadFeedbacks: sFeedback,
      unreadParentFeedbacks: pFeedback,
      pendingStudentFeedback: sFeedback,
      pendingParentsFeedback: pFeedback,
      total: messages + admissions + sFeedback + pFeedback
    });
  }).catch(() => {
    res.status(200).json({
      unreadMessages: 0, unreadAdmissions: 0,
      unreadFeedbacks: 0, unreadParentFeedbacks: 0,
      pendingStudentFeedback: 0, pendingParentsFeedback: 0, total: 0
    });
  });
});

// ============================================
// OTP ROUTE (placeholder)
// ============================================

app.post('/send-otp', publicFormLimiter, (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000;
  const key = `otp_${username}`;
  if (!global._otpStore) global._otpStore = new Map();
  global._otpStore.set(key, { otp, otpExpiry });
  debugLog(`Generated OTP ${otp} for ${username} (stored in memory)`);
  res.status(200).json({
    message: 'OTP generated successfully. For production: integrate email/SMS sending.',
    otp: isDev ? otp : undefined,
    expiresInSeconds: 600
  });
});

// ============================================
// NOTICE-BOARD ALIASES (Backward Compatibility)
// ============================================

app.get('/notice-board/banners', (req, res) => {
  executeQuery('SELECT id,image,durationSeconds,active,DATE_FORMAT(createdAt, "%Y-%m-%dT%H:%i:%sZ") AS createdAt FROM banners ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      console.error('GET /notice-board/banners error:', err);
      return res.status(500).json({ error: 'Failed to load banners' });
    }
    const normalized = (rows || []).map((r) => ({ ...r, active: r.active === 1 || r.active === true }));
    return res.status(200).json(normalized);
  });
});

app.get('/notice-board/feedback', verifyToken, (req, res) => {
  const category = (req.query.category || 'Students').toString().toLowerCase();
  const statusRaw = req.query.status;
  const statusFilter = statusRaw !== undefined ? parseInt(statusRaw, 10) : null;

  if (category === 'parents' || category === 'parent') {
    let sql = 'SELECT * FROM parents_feedback';
    const params = [];
    if (statusFilter !== null && !isNaN(statusFilter)) {
      sql += ' WHERE approved = ?';
      params.push(statusFilter);
    }
    sql += ' ORDER BY order_index ASC, id ASC';
    executeQuery(sql, params, (err, results) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
        console.error('Error fetching parents feedback (notice-board alias):', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results || []);
    });
  } else {
    let sql = 'SELECT * FROM studentfeedback';
    const params = [];
    if (statusFilter !== null && !isNaN(statusFilter)) {
      sql += ' WHERE accepted = ?';
      params.push(statusFilter);
    }
    sql += ' ORDER BY order_index ASC, id ASC';
    executeQuery(sql, params, (err, results) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') return res.status(200).json([]);
        console.error('Error fetching student feedback (notice-board alias):', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results || []);
    });
  }
});

app.post('/notice-board/banners', verifyToken, (req, res, next) => {
  req.overrideUploadFolder = 'banner';
  next();
}, uploadPublicImage.single('image'), (req, res) => {
  try {
    const imagePath = getUploadPublicPath(req.file);
    if (!imagePath) {
      return res.status(400).json({ error: 'Failed to process uploaded image' });
    }
    const durationSeconds = parseInt(req.body.durationSeconds, 10) || 5;
    const active = (req.body.active === 'true' || req.body.active === true || req.body.active === '1') ? 1 : 0;
    executeQuery('SELECT COUNT(*) AS cnt FROM banners', [], (cntErr, cntRows) => {
      if (cntErr) {
        console.error('POST /notice-board/banners count error:', cntErr);
        return res.status(500).json({ error: 'Failed to validate banner limit' });
      }
      const currentCount = (cntRows && cntRows[0] && cntRows[0].cnt) ? cntRows[0].cnt : 0;
      if (currentCount >= 2) {
        return res.status(400).json({ error: 'Maximum of 2 banners allowed. Please delete one before adding a new banner.' });
      }
      const id = String(Date.now());
      const createdAt = new Date();
      const insert = 'INSERT INTO banners (id,image,durationSeconds,active,createdAt) VALUES (?, ?, ?, ?, ?)';
      executeQuery(insert, [id, imagePath, durationSeconds, active, createdAt], (err) => {
        if (err) {
          console.error('POST /notice-board/banners DB error:', err);
          return res.status(500).json({ error: 'Failed to save banner' });
        }
        return res.status(201).json({ 
          message: 'Banner saved', 
          banner: { 
            id, 
            image: imagePath, 
            durationSeconds, 
            active: active === 1, 
            createdAt: createdAt.toISOString() 
          } 
        });
      });
    });
  } catch (err) {
    console.error('POST /notice-board/banners error:', err);
    res.status(500).json({ error: 'Failed to save banner' });
  }
});

app.put('/notice-board/banners/:id', verifyToken, (req, res) => {
  try {
    const id = req.params.id;
    const updates = [];
    const params = [];
    if (req.body.durationSeconds !== undefined) { updates.push('durationSeconds = ?'); params.push(parseInt(req.body.durationSeconds, 10) || 5); }
    if (req.body.active !== undefined) { updates.push('active = ?'); params.push((req.body.active === true || req.body.active === 'true' || req.body.active === '1') ? 1 : 0); }
    if (req.body.image !== undefined) { 
      const normalizedImage = normalizeDbPath(req.body.image);
      updates.push('image = ?'); 
      params.push(normalizedImage); 
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    const sql = `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`;
    executeQuery(sql, params, (err) => {
      if (err) {
        console.error('PUT /notice-board/banners error:', err);
        return res.status(500).json({ error: 'Failed to update banner' });
      }
      executeQuery('SELECT id,image,durationSeconds,active,DATE_FORMAT(createdAt, "%Y-%m-%dT%H:%i:%sZ") AS createdAt FROM banners WHERE id = ?', [id], (sErr, rows) => {
        if (sErr) { console.error('Failed to fetch updated banner:', sErr); return res.status(200).json({ message: 'Banner updated' }); }
        const banner = rows && rows[0] ? { ...rows[0], active: rows[0].active === 1 || rows[0].active === true } : null;
        return res.status(200).json({ message: 'Banner updated', banner });
      });
    });
  } catch (err) {
    console.error('PUT /notice-board/banners error:', err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

app.delete('/notice-board/banners/:id', verifyToken, (req, res) => {
  try {
    const id = req.params.id;
    executeQuery('SELECT image FROM banners WHERE id = ?', [id], (err, rows) => {
      if (err) { console.error('DELETE /notice-board/banners select error:', err); return res.status(500).json({ error: 'Failed to delete banner' }); }
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Banner not found' });
      const img = rows[0].image;
      executeQuery('DELETE FROM banners WHERE id = ?', [id], (delErr) => {
        if (delErr) { console.error('DELETE /notice-board/banners delete error:', delErr); return res.status(500).json({ error: 'Failed to delete banner' }); }
        if (img) safeUnlink(img);
        return res.status(200).json({ message: 'Banner deleted' });
      });
    });
  } catch (err) {
    console.error('DELETE /notice-board/banners error:', err);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// ============================================
// HELPER FUNCTIONS FOR DOWNLOAD
// ============================================

function sanitizeDownloadName(text) {
  const cleaned = String(text || 'notice').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_\-()&.\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const withoutExtension = cleaned.replace(/\.[a-zA-Z0-9]{1,5}$/g, '');
  const limited = (withoutExtension || 'notice').slice(0, 55).trim() || 'notice';
  return limited.replace(/[._-]+$/g, '') || 'notice';
}

function buildNoticeDownloadName(title, filePath) {
  const fallback = path.basename(filePath || 'notice');
  const extension = path.extname(fallback) || '';
  const baseTitle = title ? String(title).trim() : '';
  const base = sanitizeDownloadName(baseTitle || path.basename(fallback, extension) || 'notice');
  return `${base}${extension}`;
}

function resolveUploadServerPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = path.isAbsolute(normalized) ? path.resolve(normalized) : null;

  if (absolutePath && fs.existsSync(absolutePath)) {
    return absolutePath;
  }

  const candidates = [
    path.resolve(UPLOAD_ROOT, normalized),
    path.resolve(__dirname, normalized),
  ];

  if (normalized.toLowerCase().startsWith('uploads/')) {
    const stripped = normalized.slice(8);
    candidates.push(path.resolve(UPLOAD_ROOT, stripped));
  }

  const safePath = candidates.find((candidate) => candidate.startsWith(UPLOAD_ROOT) && fs.existsSync(candidate));
  return safePath || null;
}

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Uploaded file is too large. Maximum size is 100MB.' });
  }
  if (err && err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Invalid file upload: ' + err.message });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the process using this port or set a different PORT environment variable.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 66 * 1000;