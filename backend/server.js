import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { seedUsers } from './utils/seeder.js';
import authRoutes from './routes/authRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import poRoutes from './routes/poRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';


dotenv.config();

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Seed default users (Admin, Manager, User)
  await seedUsers();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/quotations', quotationRoutes);
  app.use('/api/pos', poRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/pdf', pdfRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);


  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Procurement API is running' });
  });



  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();