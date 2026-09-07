// server/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/Contact.js';
import homeRoutes from './routes/Home.js'; 
import serviceRoutes from './routes/Service.js';
import clientRoutes from './routes/Client.js';
import statusRoutes from './routes/Status.js';

dotenv.config();

console.log('📊 Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
});

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://base-admin-rouge.vercel.app',
  'https://base-frontend-rose.vercel.app'
].filter(Boolean);

console.log('✅ Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/contacts', contactRoutes);
app.use('/home', homeRoutes);
app.use('/service', serviceRoutes);
app.use('/clients', clientRoutes);
app.use('/status', statusRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// MongoDB Connection with Retry Logic
// ========================================
const connectWithRetry = async (retries = 5, delay = 5000) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/base_experts';
  
  console.log(`📊 Attempting to connect to MongoDB... (${retries} retries left)`);
  
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying in ${delay/1000} seconds... (${retries-1} retries left)`);
      setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
      console.error('❌ All retries failed. Exiting...');
      process.exit(1);
    }
  }
};

// Start with retry
connectWithRetry();

// Graceful Shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1);
  }
});