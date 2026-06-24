import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDB } from './config/db';

// Import routes
import authRoutes from './routes/auth';
import assessmentRoutes from './routes/assessment';
import paymentRoutes from './routes/payment';
import resultRoutes from './routes/result';
import certificateRoutes from './routes/certificate';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For local dev convenience, allow any client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Simple Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'express-backend' });
});

// Start Server and Initialize Database
const startServer = async () => {
  try {
    console.log('[Backend] Bootstrapping tables...');
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`[Backend] Express server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Backend] Startup failed:', error);
    process.exit(1);
  }
};

startServer();
