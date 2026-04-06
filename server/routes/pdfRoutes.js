import express from 'express';
import { generatePDF, generateInvoicePDF } from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// The new specifically requested route
router.get('/download-invoice', generateInvoicePDF);

router.get('/:type/:id', protect, generatePDF);

export default router;