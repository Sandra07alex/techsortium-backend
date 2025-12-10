import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 5000;

// Normalize event slugs and handle known aliases
const normalizeSlug = (slug) => {
  const safe = (slug || '').toString().trim().toLowerCase();
  const aliases = {
    'web-dev-competition': 'web-development-competition',
    'webdev-competition': 'web-development-competition',
    'web-development-comp': 'web-development-competition',
  };
  return aliases[safe] || safe;
};

// Log selected environment variables safely (masks secrets)
const mask = (val) => {
  if (!val) return '[NOT SET]';
  try {
    const s = String(val);
    if (s.length <= 8) return '***';
    return `${s.slice(0, 4)}...${s.slice(-4)} (len:${s.length})`;
  } catch (e) {
    return '[UNAVAILABLE]';
  }
};

const logEnv = () => {
  try {
    console.log('--- Environment configuration ---');
    console.log('- PORT:', PORT);
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('- VERCEL:', process.env.VERCEL || 'undefined');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || '[NOT SET]');
    console.log('- MONGODB_URI:', mask(process.env.MONGODB_URI));
    console.log('- IMGBB_API_KEY:', process.env.IMGBB_API_KEY ? '[SET]' : '[NOT SET]');
    console.log('---------------------------------');
  } catch (err) {
    console.error('Failed to log env variables:', err && err.message);
  }
};

logEnv();

// Trust proxy for Vercel/production environments
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8080', // Add port 8080 support
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://techsortium-dashboard.vercel.app',
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    // In development, allow all localhost origins
    // In production, allow Vercel domains
    if (!origin || 
        allowedOrigins.indexOf(origin) !== -1 || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// GZIP Compression - major performance boost
app.use(compression({
  threshold: 0, // Compress all responses
  level: 6, // Compression level (0-9)
  filter: (req, res) => {
    // Don't compress file uploads
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Cache middleware for GET requests (5 minutes for events, 1 minute for registrations)
app.use((req, res, next) => {
  // Cache GET requests only
  if (req.method === 'GET') {
    const cacheTime = req.path.includes('/registrations') ? 60 : 300; // 5 min for events, 1 min for registrations
    res.set('Cache-Control', `public, max-age=${cacheTime}`);
  } else {
    res.set('Cache-Control', 'no-cache');
  }
  next();
});

// Additional CORS headers for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📨 Incoming request: ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  }
  
  // Allow localhost on any port in development
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('vercel.app')) {
    // Allow all vercel.app domains (including preview deployments)
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only log responses in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const oldJson = res.json.bind(res);
    res.json = (body) => {
      console.log(`<< Response -- ${req.method} ${req.originalUrl} ${res.statusCode || 200}`);
      return oldJson(body);
    };
    next();
  });
}

// Rate limiting middleware - INCREASED SESSION EXPIRING TIME
const registrationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // Increased from 5 minutes to 30 minutes
  max: 30, // Increased from 10 to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
    errorCode: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// MongoDB connection
let db;
let eventsCollection;
let registrationsCollection;
let client;
let isConnecting = false;

const connectDB = async () => {
  // Reuse global client/collections in serverless environments
  if (globalThis._mongoClient && globalThis._eventsCollection && globalThis._registrationsCollection) {
    client = globalThis._mongoClient;
    eventsCollection = globalThis._eventsCollection;
    registrationsCollection = globalThis._registrationsCollection;
    return;
  }

  // If connection is in progress, wait
  if (isConnecting) {
    await new Promise(resolve => {
      const checkConnection = setInterval(() => {
        if (eventsCollection || !isConnecting) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
    });
    return;
  }

  isConnecting = true;
  try {
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // MongoDB connection options for SSL/TLS
    // Vercel-specific configuration to handle TLS issues
    const mongoOptions = {
      serverSelectionTimeoutMS: 30000, // Increased timeout for serverless
      socketTimeoutMS: 75000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      // Force TLS 1.2+ and disable certificate validation issues
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      // Add these for better compatibility with Vercel/serverless
      maxPoolSize: 50, // allow moderate bursts
      minPoolSize: 1,
    };

    console.log('🔌 Attempting to connect to MongoDB...');
    client = new MongoClient(connectionString, mongoOptions);
    
    // Test connection with a simple operation
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB ping successful');
    db = client.db('techsortium');
    eventsCollection = db.collection('events');
    registrationsCollection = db.collection('registrations');
    
    // Create indexes
    await eventsCollection.createIndex({ slug: 1 }, { unique: true });
    // Allow duplicate email+event combinations (removed unique constraint)
    await registrationsCollection.createIndex({ email: 1, eventSlug: 1 });
    await registrationsCollection.createIndex({ eventSlug: 1 });
    await registrationsCollection.createIndex({ registrationId: 1 }, { unique: true });
    
    // Allow duplicate IEEE membership numbers (removed unique constraint)
    await registrationsCollection.createIndex(
      { membershipNumber: 1 },
      { partialFilterExpression: { membershipNumber: { $exists: true } } }
    );
    
    // Persist to globals for serverless reuse
    try {
      globalThis._mongoClient = client;
      globalThis._eventsCollection = eventsCollection;
      globalThis._registrationsCollection = registrationsCollection;
    } catch (e) {
      // ignore in non-global environments
    }
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      errorLabelSet: error.errorLabelSet,
    });
    
    // Provide helpful error messages
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('\n💡 SSL/TLS Error Tips:');
      console.error('   1. Verify your MongoDB connection string includes SSL parameters');
      console.error('   2. Check if your IP is whitelisted in MongoDB Atlas');
      console.error('   3. Try updating Node.js to version 18+');
      console.error('   4. Test connection string in MongoDB Compass first');
      console.error('   5. Run: npm run test-connection');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Error Tips:');
      console.error('   1. Verify username and password in connection string');
      console.error('   2. Check database user exists in MongoDB Atlas');
      console.error('   3. Ensure password doesn\'t contain special characters that need URL encoding');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Network Error Tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MongoDB Atlas cluster is running (not paused)');
      console.error('   3. Check firewall/antivirus settings');
    }
    
    eventsCollection = null;
    registrationsCollection = null;
    isConnecting = false;
    throw error;
  } finally {
    isConnecting = false;
  }
};

// ImgBB upload function
const uploadToImgBB = async (imageBuffer, imageName) => {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      new URLSearchParams({
        image: base64Image,
        name: imageName,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Fail fast so the frontend isn't stuck on "Verifying" for too long
        timeout: 15000,
      }
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        url: response.data.data.url,
        displayUrl: response.data.data.display_url,
        deleteUrl: response.data.data.delete_url,
      };
    } else {
      throw new Error('ImgBB upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error.message);
    throw new Error('Failed to upload image to ImgBB: ' + error.message);
  }
};

// Validation middleware for registration
const validateRegistration = (req, res, next) => {
  let {
    eventSlug,
    name,
    email,
    whatsapp,
    college,
    semester,
    branch,
    isIEEEMember,
    membershipGrade,
    membershipNumber,
    paymentDone,
  } = req.body;

  const errors = [];

  // Convert string booleans to actual booleans (form data comes as strings)
  if (typeof isIEEEMember === 'string') {
    isIEEEMember = isIEEEMember === 'true';
  }
  if (typeof paymentDone === 'string') {
    paymentDone = paymentDone === 'true';
  }

  // Update req.body with converted values
  req.body.isIEEEMember = isIEEEMember;
  req.body.paymentDone = paymentDone;

    // Normalize slug and validate
    const normalizedSlug = typeof eventSlug === 'string' ? eventSlug.trim().toLowerCase() : '';
    req.body.eventSlug = normalizedSlug;
    if (!normalizedSlug || normalizedSlug.length < 1) {
      errors.push('Event slug is required');
    }

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email address is required');
  }

  // Validate whatsapp (10 digits)
  const whatsappRegex = /^\d{10}$/;
  if (!whatsapp || !whatsappRegex.test(whatsapp)) {
    errors.push('WhatsApp number must be 10 digits');
  }

  // Validate college
  if (!college || college.trim().length < 2) {
    errors.push('College name is required');
  }

  // Validate semester
  if (!semester || !['1', '2', '3', '4', '5', '6', '7', '8', 'PG'].includes(semester)) {
    errors.push('Valid semester is required');
  }

  // Validate branch
  if (!branch || branch.trim().length < 2) {
    errors.push('Branch is required');
  }

  // Validate isIEEEMember (should now be a boolean)
  if (typeof isIEEEMember !== 'boolean') {
    errors.push('IEEE membership status must be true or false');
  }

  // Validate IEEE membership details if member
  if (isIEEEMember === true) {
    if (!membershipGrade || !membershipNumber || membershipNumber.trim().length < 5) {
      errors.push('IEEE membership grade and number are required for IEEE members');
    }
  }

  // Validate paymentDone (should now be a boolean)
  if (typeof paymentDone !== 'boolean') {
    errors.push('Payment status must be true or false');
  }

  // Validate file upload if paymentDone is true and user is not IEEE member
  if (paymentDone === true && !isIEEEMember && !req.file) {
    errors.push('Payment screenshot is required when payment is done (not applicable for IEEE members)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: errors,
    });
  }

  next();
};

// Generate short registration ID
const generateRegistrationId = () => {
  const shortId = uuidv4().split('-')[0].toUpperCase();
  return `TS-${shortId}`;
};

// API Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    running: true,
    service: 'Techsortium Backend API',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
      isVercel: process.env.VERCEL === '1',
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasImgbbKey: !!process.env.IMGBB_API_KEY,
    }
  });
});

// Diagnostic endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
      isVercel: process.env.VERCEL === '1',
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      frontendUrl: process.env.FRONTEND_URL || '[NOT SET]',
      hasMongoUri: !!process.env.MONGODB_URI,
      hasImgbbKey: !!process.env.IMGBB_API_KEY,
    },
    database: {
      connected: false,
      collections: {
        events: false,
        registrations: false,
      }
    }
  };

  try {
    await connectDB();
    health.database.connected = true;
    health.database.collections.events = !!eventsCollection;
    health.database.collections.registrations = !!registrationsCollection;
    
    // Test a simple query
    if (eventsCollection) {
      const count = await eventsCollection.countDocuments();
      health.database.eventsCount = count;
    }
  } catch (error) {
    health.status = 'error';
    health.database.error = error.message;
  }

  return res.json(health);
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    await connectDB();
    if (!eventsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'Database not connected'
      });
    }

    const events = await eventsCollection.find({}).toArray();
    
    // Remove MongoDB _id and return clean event objects
    const cleanEvents = events.map(event => {
      const { _id, ...eventData } = event;
      return eventData;
    });

    return res.json(cleanEvents);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// Get single event by slug
app.get('/api/events/:slug', async (req, res) => {
  try {
    await connectDB();
    if (!eventsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'Database not connected'
      });
    }

    const normalizedSlug = normalizeSlug(req.params.slug);
    const event = await eventsCollection.findOne({ slug: normalizedSlug });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        attemptedSlug: normalizedSlug
      });
    }

    const { _id, ...eventData } = event;
    return res.json(eventData);
  } catch (error) {
    console.error('Error fetching event:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
});

// Register for an event
app.post('/api/register', registrationLimiter, upload.single('paymentScreenshot'), validateRegistration, async (req, res) => {
  const registrationStartTime = Date.now();
  let normalizedSlug = '';
  let capacityReserved = false;

  try {
    await connectDB();
    if (!registrationsCollection || !eventsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'Database not connected'
      });
    }

    const {
      eventSlug,
      name,
      email,
      whatsapp,
      college,
      semester,
      branch,
      isIEEEMember,
      membershipGrade,
      membershipNumber,
      paymentDone,
    } = req.body;

    normalizedSlug = normalizeSlug(eventSlug);
    const normalizedEmail = String(email || '').trim().toLowerCase();

    console.log(`📝 New registration attempt: ${email} for event ${normalizedSlug}`);

    // Check if event exists
    const event = await eventsCollection.findOne({ slug: normalizedSlug });
    if (!event) {
      const available = await eventsCollection.find({}, { projection: { _id: 0, slug: 1, title: 1 } }).toArray();
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: `Unknown event slug: ${normalizedSlug}`,
        availableEvents: available,
        errorCode: 'EVENT_NOT_FOUND'
      });
    }

    // Atomically reserve a slot - only check capacity if capacity is defined and > 0
    if (event.capacity !== null && event.capacity > 0) {
      const reservation = await eventsCollection.findOneAndUpdate(
        {
          slug: normalizedSlug,
          $expr: {
            $gt: ['$capacity', { $ifNull: ['$registeredCount', 0] }]
          }
        },
        [
          {
            $set: {
              registeredCount: { $add: [{ $ifNull: ['$registeredCount', 0] }, 1] }
            }
          }
        ],
        { returnDocument: 'after' }
      );

      if (!reservation.value) {
        return res.status(409).json({
          success: false,
          message: 'Event is full',
          error: 'This event has reached its capacity limit',
          errorCode: 'EVENT_FULL'
        });
      }

      capacityReserved = true;
    } else {
      // If capacity is null or 0, just increment the count without checking
      await eventsCollection.findOneAndUpdate(
        { slug: normalizedSlug },
        [
          {
            $set: {
              registeredCount: { $add: [{ $ifNull: ['$registeredCount', 0] }, 1] }
            }
          }
        ],
        { returnDocument: 'after' }
      );
      capacityReserved = false;
    }

    // Check if email already registered for this event - DISABLED to allow duplicate registrations
    // const existingRegistration = await registrationsCollection.findOne({
    //   email: normalizedEmail,
    //   eventSlug: normalizedSlug
    // });

    // if (existingRegistration) {
    //   console.log(`⚠️  Duplicate email attempt: ${email} for event ${normalizedSlug}`);
    //   return res.status(409).json({
    //     success: false,
    //     message: 'Already registered',
    //     error: 'This email address has already been used for this event',
    //     errorCode: 'DUPLICATE_EMAIL'
    //   });
    // }

    const normalizedMembershipNumber = membershipNumber ? membershipNumber.trim() : undefined;
    const normalizedMembershipGrade = membershipGrade ? membershipGrade.trim() : undefined;

    // Check IEEE membership number uniqueness if provided - DISABLED to allow duplicate registrations
    // if (isIEEEMember && normalizedMembershipNumber) {
    //   const existingByMembership = await registrationsCollection.findOne({
    //     membershipNumber: normalizedMembershipNumber,
    //     eventSlug: normalizedSlug
    //   });

    //   if (existingByMembership) {
    //     console.log(`⚠️  Duplicate IEEE membership number: ${normalizedMembershipNumber}`);
    //     return res.status(409).json({
    //       success: false,
    //       message: 'IEEE Membership Number already registered',
    //       error: 'This IEEE Membership Number has already been used for this event',
    //       errorCode: 'DUPLICATE_IEEE_MEMBERSHIP'
    //     });
    //   }
    // }

    // Upload payment screenshot if provided
    let paymentScreenshotUrl = null;
    let paymentScreenshotDeleteUrl = null;

    if (paymentDone && req.file) {
      if (!process.env.IMGBB_API_KEY) {
        // Skip external upload to avoid long waits when the API key is missing
        console.warn('⚠️  IMGBB_API_KEY not set; skipping screenshot upload.');
        paymentScreenshotUrl = '[not uploaded: IMGBB_API_KEY missing]';
      } else {
        console.log(`📤 Uploading payment screenshot to ImgBB...`);
        const uploadResult = await uploadToImgBB(
          req.file.buffer,
          `payment_${eventSlug}_${Date.now()}`
        );

        if (!uploadResult.success) {
          throw new Error('Failed to upload payment screenshot');
        }

        paymentScreenshotUrl = uploadResult.url;
        paymentScreenshotDeleteUrl = uploadResult.deleteUrl;
      }
    }

    // Generate registration ID
    const registrationId = generateRegistrationId();

    // Prepare registration document
    const registrationDoc = {
      registrationId: registrationId,
      eventSlug: normalizedSlug,
      eventTitle: event.title,
      name: name.trim(),
      email: normalizedEmail,
      whatsapp: whatsapp.trim(),
      college: college.trim(),
      semester: semester,
      branch: branch.trim(),
      isIEEEMember: isIEEEMember,
      paymentDone: paymentDone,
      paymentScreenshotUrl: paymentScreenshotUrl,
      paymentScreenshotDeleteUrl: paymentScreenshotDeleteUrl,
      status: paymentDone ? 'pending_verification' : 'pending_payment',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Attach membership fields only when applicable to avoid null unique collisions
    if (isIEEEMember && normalizedMembershipNumber) {
      registrationDoc.membershipGrade = normalizedMembershipGrade || null;
      registrationDoc.membershipNumber = normalizedMembershipNumber;
    }

    // Insert registration
    await registrationsCollection.insertOne(registrationDoc);

    const processingTime = Date.now() - registrationStartTime;
    console.log(`✅ Registration successful for ${email} (${processingTime}ms)`);

    // Determine next step
    const next = paymentDone ? 'thank-you' : 'payment';

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      id: registrationId,
      next: next,
      data: {
        registrationId: registrationId,
        email: email.toLowerCase().trim(),
        status: registrationDoc.status,
      },
    });

  } catch (error) {
    console.error('❌ Registration error:', error.message);

    // Roll back capacity reservation on failure
    if (capacityReserved) {
      try {
        await eventsCollection.updateOne({ slug: normalizedSlug }, { $inc: { registeredCount: -1 } });
      } catch (rollbackErr) {
        console.error('⚠️  Failed to roll back capacity reservation:', rollbackErr.message);
      }
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      let dupKey = 'DUPLICATE_KEY';
      try {
        if (error.keyValue) {
          const field = Object.keys(error.keyValue)[0];
          if (field === 'email') dupKey = 'DUPLICATE_EMAIL';
          else if (field === 'membershipNumber') dupKey = 'DUPLICATE_IEEE_MEMBERSHIP';
          else dupKey = `DUPLICATE_${field.toUpperCase()}`;
        }
      } catch (e) {}

      return res.status(409).json({
        success: false,
        message: 'Registration already exists',
        error: 'A unique constraint was violated',
        errorCode: dupKey,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

// Get registrations for an event (optional admin endpoint)
app.get('/api/registrations/:slug', async (req, res) => {
  try {
    await connectDB();
    if (!registrationsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'Database not connected'
      });
    }

    const normalizedSlug = normalizeSlug(req.params.slug);

    // Optional: Add authentication/authorization here for admin access

    const registrations = await registrationsCollection.find({
      eventSlug: normalizedSlug
    }).toArray();

    // Remove sensitive data
    const safeRegistrations = registrations.map(reg => {
      const { paymentScreenshotDeleteUrl, ...safeData } = reg;
      const { _id, ...cleanData } = safeData;
      return cleanData;
    });

    return res.json(safeRegistrations);
  } catch (error) {
    console.error('Error fetching registrations:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
});

// Get registration by ID
app.get('/api/registration/:id', async (req, res) => {
  try {
    await connectDB();
    if (!registrationsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        error: 'Database not connected'
      });
    }

    const { id } = req.params;
    
    const registration = await registrationsCollection.findOne({
      registrationId: id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Remove sensitive data
    const { paymentScreenshotDeleteUrl, _id, ...safeData } = registration;

    return res.json({
      success: true,
      data: safeData
    });
  } catch (error) {
    console.error('Error fetching registration:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch registration',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
      errorCode: 'FILE_UPLOAD_ERROR',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Initialize for serverless (non-blocking)
if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  console.log('🚀 Serverless mode detected');
} else {
  // Development mode - connect immediately
  (async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Events endpoint: http://localhost:${PORT}/api/events`);
        console.log(`📍 Registration endpoint: http://localhost:${PORT}/api/register`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  })();
}

// Export handler for serverless (Vercel)
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connect failed in handler:', err && err.message);
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: 'Database connection failed'
    });
  }

  return app(req, res);
}

