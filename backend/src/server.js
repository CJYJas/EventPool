import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import { sendError, sendSuccess } from './utils/response.js';
import borrowingRequestRoutes from './routes/borrowingRequestRoutes.js';
import { db } from './config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS and body parsers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder if fallback storage is used
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'EventPool API is operational', {
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes on /api
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/borrowing-requests', borrowingRequestRoutes);

// Dev / Demo reset endpoint to reset Firestore to initial testing state
app.post('/api/dev/reset-demo', async (req, res) => {
  try {
    // 1. Reset Resources
    await db.collection('Resources').doc('res-pekom-speaker').set({
      resourceId: 'res-pekom-speaker',
      clubId: 'club-pekom',
      itemName: 'Portable Speakers',
      category: 'Audio & Visual',
      totalQuantity: 4,
      availableQuantity: 2,
      reservedQuantity: 2,
      borrowedQuantity: 0,
      condition: 'Good',
      location: 'Block A, Storeroom 2',
      description: 'Pair of wireless PA speakers with stands.',
      estimatedUnitCost: 450,
      estimatedUnitWeight: 5.5,
      isArchived: false,
      isTemporarilyUnavailable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await db.collection('Resources').doc('res-pekom-easels').set({
      resourceId: 'res-pekom-easels',
      clubId: 'club-pekom',
      itemName: 'Display Easels',
      category: 'Exhibition & Display',
      totalQuantity: 6,
      availableQuantity: 4,
      reservedQuantity: 0,
      borrowedQuantity: 2,
      condition: 'Good',
      location: 'Block A, Storeroom 2',
      description: 'Adjustable wooden display easels for posters.',
      estimatedUnitCost: 65,
      estimatedUnitWeight: 1.8,
      isArchived: false,
      isTemporarilyUnavailable: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 2. Reset Borrowing Requests
    await db.collection('BorrowingRequests').doc('req-101').set({
      requestId: 'req-101',
      resourceId: 'res-pekom-speaker',
      ownerClubId: 'club-pekom',
      requesterClubId: 'PTUM',
      quantity: 2,
      purpose: 'Culture Night 2026',
      pickupDate: '2026-11-25',
      expectedReturnDate: '2026-11-27',
      status: 'Approved',
      wouldHavePurchased: true,
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-21T10:00:00.000Z',
    });

    await db.collection('BorrowingRequests').doc('req-102').set({
      requestId: 'req-102',
      resourceId: 'res-pekom-easels',
      ownerClubId: 'club-pekom',
      requesterClubId: 'UMDSC',
      quantity: 4,
      purpose: 'Student Showcase',
      pickupDate: '2026-11-24',
      expectedReturnDate: '2026-11-25',
      status: 'Pending',
      wouldHavePurchased: true,
      createdAt: '2026-11-22T10:00:00.000Z',
      updatedAt: '2026-11-22T10:00:00.000Z',
    });

    await db.collection('BorrowingRequests').doc('req-109').set({
      requestId: 'req-109',
      resourceId: 'res-pekom-easels',
      ownerClubId: 'club-pekom',
      requesterClubId: '7tY84DMF1uTQpyEo6Ab6',
      quantity: 2,
      purpose: 'Exhibition display panels return.',
      pickupDate: '2026-11-20',
      expectedReturnDate: '2026-11-23',
      actualReturnDate: '2026-11-23',
      status: 'Return Pending',
      wouldHavePurchased: false,
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-23T10:00:00.000Z',
    });

    return sendSuccess(res, 'Demo data reset successfully in Firestore.');
  } catch (err) {
    console.error('Failed to reset demo data in Firestore:', err);
    return sendError(res, 'Failed to reset demo data', 'RESET_FAILED', 500);
  }
});

// 404 handler for unmapped endpoints
app.use((req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404);
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.statusCode || 500;
  return sendError(res, err.message || 'Internal server error', err.code || 'INTERNAL_ERROR', status);
});

// Only listen when run directly (allows importing in tests if needed)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[EventPool API] Server running on port ${PORT}`);
    console.log(`[EventPool API] Base URL: http://localhost:${PORT}/api`);
  });
}

export default app;

