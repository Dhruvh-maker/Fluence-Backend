import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { getConfig } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Import routes
import referralRoutes from './routes/referral.routes.js';
// import campaignRoutes from './routes/campaign.routes.js';
// import leaderboardRoutes from './routes/leaderboard.routes.js';

const app = express();
const config = getConfig();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4001', 'http://localhost:4005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'referral-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/referral', referralRoutes);
// app.use('/api/campaigns', campaignRoutes);
// app.use('/api/leaderboard', leaderboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'referral-service',
    message: 'Referral Service API',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      referral: '/api/referral',
      campaigns: '/api/campaigns',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
