import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { Quotation, PurchaseOrder, Invoice, Payment } from '../models/index.js';

export const downloadInvoicePDF = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Invoice ID:", id);
    
    const invoiceData = await Invoice.findById(id).populate('poId').populate('createdBy', 'name').populate('vendorId');
    console.log("Invoice Data:", invoiceData);
    
    if (!invoiceData) {
      console.log("Invoice not found for ID:", id);
      return res.status(404).json({ message: 'Document not found' });
    }

    const payments = await Payment.find({ invoiceId: id });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const amountDue = invoiceData.grandTotal - totalPaid;
    
    const data = invoiceData.toObject();
    
    const templatePath = path.join(process.cwd(), 'server/templates/invoice.ejs');
    const html = await ejs.renderFile(templatePath, {
      doc: data,
      type: 'INVOICE',
      date: new Date(invoiceData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      totalPaid,
      amountDue
    });

    console.log("Rendered HTML Length:", html.length);
    if (html.length === 0) {
      console.log("Warning: Rendered HTML is empty");
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    // Convert to Buffer because Puppeteer returns Uint8Array which Express may serialize to JSON
    const pdf = Buffer.from(pdfUint8);

    await browser.close();

    const filename = `invoice-${data.invoiceNumber || id}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.send(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

export const generatePDF = async (req, res) => {
  try {
    const { type, id } = req.params;
    let data;

    if (type === 'quotation') {
      data = await Quotation.findById(id).populate('vendorId').populate('createdBy', 'name');
    } else if (type === 'po') {
      data = await PurchaseOrder.findById(id).populate('vendorId').populate('createdBy', 'name');
    } else if (type === 'invoice') {
      const invoiceData = await Invoice.findById(id).populate('vendorId').populate('createdBy', 'name');
      if (invoiceData) {
        const payments = await Payment.find({ invoiceId: id });
        const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        const balanceDue = invoiceData.grandTotal - totalPaid;
        
        // Convert to a plain object so we can inject extra virtual properties safely
        data = invoiceData.toObject();
        data.totalPaid = totalPaid;
        data.balanceDue = balanceDue;
      }
    }

    if (!data) return res.status(404).json({ message: 'Document not found' });

    let totalPaid = 0;
    let amountDue = data.grandTotal || 0;

    if (type === 'invoice') {
      const payments = await Payment.find({ invoiceId: id });
      totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      amountDue = data.grandTotal - totalPaid;
    }

    const templateName = type === 'invoice' ? 'invoice.ejs' : 'document.ejs';
    const templatePath = path.join(process.cwd(), `server/templates/${templateName}`);
    const html = await ejs.renderFile(templatePath, {
      doc: data,
      type: type.toUpperCase(),
      date: new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), // formatting to "25 June 2022" style
      totalPaid,
      amountDue
    });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
    const pdf = Buffer.from(pdfUint8);

    await browser.close();

    const filename = `${type.toUpperCase()}-${data.invoiceNumber || data.poNumber || data.quotationNumber || id}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

export const generateInvoicePDF = async (req, res) => {
  try {
    const mockInvoiceData = {
      clientName: "Ketut Susilo",
      clientPhone: "123-456-7890",
      clientEmail: "hello@reallygreatsite.com",
      clientAddress: "123 Anywhere St., Any City",
      invoiceNumber: "12345",
      date: "25 June 2022",
      items: [
        { description: "Logo Design", qty: 5, price: 100, total: 500 },
        { description: "Website Design", qty: 2, price: 800, total: 1600 },
        { description: "Brand Design", qty: 3, price: 300, total: 900 },
        { description: "Banner Design", qty: 2, price: 300, total: 600 },
        { description: "Flyer Design", qty: 2, price: 400, total: 800 },
        { description: "Social Media Template", qty: 10, price: 50, total: 500 },
        { description: "Name Card", qty: 15, price: 25, total: 750 },
        { description: "Web Developer", qty: 2, price: 1000, total: 2000 }
      ],
      subTotal: 7650,
      taxRate: 15,
      taxAmount: 1148,
      grandTotal: 8798,
      bankName: "Borcelle",
      accountNumber: "123-456-7890"
    };

    const templatePath = path.join(process.cwd(), 'server/templates/document.ejs');
    const html = await ejs.renderFile(templatePath, {
      invoice: mockInvoiceData
    });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // CRITICAL: printBackground: true so colors render
    const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
    const pdf = Buffer.from(pdfUint8);

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
      'Content-Length': pdf.length
    });
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};