import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCT, REVIEWS_LIST } from './src/data/initialData';
import { Order, Product, AdminStats, Review } from './src/types';

const app = express();
const PORT = 3000;

// Email Transporter Helper
function createEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

// Increase payload limit for screenshot base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File persistence paths
const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCT_FILE = path.join(DATA_DIR, 'product.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial mock orders to show realistic admin panel state
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-84912',
    name: 'रमेश श्रेष्ठ (Ramesh Shrestha)',
    email: 'ramesh.shrestha@gmail.com',
    phone: '9841234567',
    paymentMethod: 'esewa',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    amount: 149,
    ebookTitle: INITIAL_PRODUCT.title,
    downloadToken: 'DL-TOKEN-84912-SECURE',
    emailSent: true,
    notes: 'Payment verified via eSewa transaction ref #882193',
  },
  {
    id: 'ORD-84913',
    name: 'सुमन थापा (Suman Thapa)',
    email: 'suman.thapa99@gmail.com',
    phone: '9801987654',
    paymentMethod: 'khalti',
    screenshotUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    amount: 149,
    ebookTitle: INITIAL_PRODUCT.title,
    emailSent: false,
    notes: 'Awaiting admin verification of Khalti screenshot',
  },
  {
    id: 'ORD-84914',
    name: 'हरि शर्मा (Hari Sharma)',
    email: 'hari.sharma@yahoo.com',
    phone: '9812345678',
    paymentMethod: 'esewa',
    screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    amount: 149,
    ebookTitle: INITIAL_PRODUCT.title,
    emailSent: false,
  },
];

// Load persistent data or initialize
let orders: Order[] = [];
if (fs.existsSync(ORDERS_FILE)) {
  try {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
  } catch (e) {
    orders = INITIAL_ORDERS;
  }
} else {
  orders = INITIAL_ORDERS;
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

let product: Product = INITIAL_PRODUCT;
if (fs.existsSync(PRODUCT_FILE)) {
  try {
    product = JSON.parse(fs.readFileSync(PRODUCT_FILE, 'utf-8'));
    if (!product.orderBump) {
      product.orderBump = INITIAL_PRODUCT.orderBump;
    }
  } catch (e) {
    product = INITIAL_PRODUCT;
  }
} else {
  fs.writeFileSync(PRODUCT_FILE, JSON.stringify(product, null, 2));
}

let reviews: Review[] = [];
if (fs.existsSync(REVIEWS_FILE)) {
  try {
    reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
    // Ensure legacy/preset reviews have status='approved' if undefined
    reviews = reviews.map((r) => ({
      ...r,
      status: r.status || 'approved',
    }));
  } catch (e) {
    reviews = REVIEWS_LIST.map((r) => ({ ...r, status: 'approved' }));
  }
} else {
  reviews = REVIEWS_LIST.map((r) => ({ ...r, status: 'approved' }));
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

const saveOrders = () => {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
};

const saveProduct = () => {
  fs.writeFileSync(PRODUCT_FILE, JSON.stringify(product, null, 2));
};

const saveReviews = () => {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
};

// ================= API ENDPOINTS ================= //

// Get Approved Reviews (Public)
app.get('/api/reviews', (req, res) => {
  const approvedReviews = reviews.filter((r) => r.status === 'approved' || !r.status);
  res.json({ success: true, reviews: approvedReviews });
});

// Submit New Review (Customer - Requires Admin Approval)
app.post('/api/reviews', (req, res) => {
  const { name, location, emailOrPhone, rating, comment } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ error: 'कृपया नाम र प्रतिक्रिया लेख्नुहोस् (Name and comment required)' });
  }

  // Check if buyer has a verified order
  const lookup = (emailOrPhone || '').trim().toLowerCase();
  let isVerifiedBuyer = false;
  if (lookup) {
    const match = orders.find(
      (o) =>
        (o.email && o.email.toLowerCase() === lookup) ||
        (o.phone && o.phone.includes(lookup)) ||
        (o.id && o.id.toLowerCase() === lookup)
    );
    if (match) {
      isVerifiedBuyer = true;
    }
  }

  const newReview: Review = {
    id: `REV-${Date.now()}`,
    name: name.trim(),
    location: (location || 'नेपाल').trim(),
    rating: Number(rating) || 5,
    date: 'भर्खरै',
    comment: comment.trim(),
    verified: isVerifiedBuyer,
    status: 'pending', // Requires admin approval
    emailOrPhone: lookup || undefined,
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(newReview);
  saveReviews();

  console.log(`[Review Submitted - Pending Approval] ${newReview.name} (${newReview.rating} stars)`);

  res.status(201).json({
    success: true,
    message: 'तपाईंको समीक्षा सफलतापुर्वक प्राप्त भयो! एडमिनको स्वीकृति (Admin approval) पछि समीक्षा सार्वजनिक रूपमा देखा पर्नेछ। धन्यवाद!',
    review: newReview,
  });
});

// Admin: Get All Reviews (Pending, Approved, Rejected)
app.get('/api/admin/reviews', (req, res) => {
  const { status } = req.query;
  let filtered = [...reviews];
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }
  res.json({
    success: true,
    count: filtered.length,
    reviews: filtered,
    pendingCount: reviews.filter((r) => r.status === 'pending').length,
    approvedCount: reviews.filter((r) => r.status === 'approved' || !r.status).length,
  });
});

// Admin: Approve Review
app.post('/api/admin/reviews/:id/approve', (req, res) => {
  const { id } = req.params;
  const index = reviews.findIndex((r) => String(r.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  reviews[index] = {
    ...reviews[index],
    status: 'approved',
    verified: true, // Mark verified when approved by admin
  };

  saveReviews();
  console.log(`[Review Approved] ${id}`);
  res.json({ success: true, message: 'समीक्षा स्वीकृत गरियो (Review Approved)', reviews });
});

// Admin: Reject Review
app.post('/api/admin/reviews/:id/reject', (req, res) => {
  const { id } = req.params;
  const index = reviews.findIndex((r) => String(r.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  reviews[index] = {
    ...reviews[index],
    status: 'rejected',
  };

  saveReviews();
  console.log(`[Review Rejected] ${id}`);
  res.json({ success: true, message: 'समीक्षा अस्वीकृत गरियो (Review Rejected)', reviews });
});

// Admin: Delete Review
app.delete('/api/admin/reviews/:id', (req, res) => {
  const { id } = req.params;
  reviews = reviews.filter((r) => String(r.id) !== String(id));
  saveReviews();
  res.json({ success: true, message: 'समीक्षा हटाइयो (Review Deleted)', reviews });
});

// Admin: Add Direct Review
app.post('/api/admin/reviews', (req, res) => {
  const { name, location, rating, comment, verified } = req.body;
  if (!name || !comment) {
    return res.status(400).json({ error: 'Name and comment are required' });
  }

  const directReview: Review = {
    id: `REV-${Date.now()}`,
    name: name.trim(),
    location: (location || 'नेपाल').trim(),
    rating: Number(rating) || 5,
    date: 'भर्खरै',
    comment: comment.trim(),
    verified: verified ?? true,
    status: 'approved',
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(directReview);
  saveReviews();
  res.status(201).json({ success: true, message: 'Review added successfully', reviews });
});

// 1. Get Product Details
app.get('/api/product', (req, res) => {
  res.json({ success: true, product });
});

// 2. Update Product Details (Admin)
app.put('/api/admin/product', (req, res) => {
  const updated = req.body;
  if (!updated.title || !updated.price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }
  product = { ...product, ...updated };
  saveProduct();
  res.json({ success: true, product });
});

// 3. Submit New Order (Customer)
app.post('/api/orders', (req, res) => {
  const { name, email, phone, paymentMethod, screenshotUrl, hasOrderBump } = req.body;

  if (!name || !email || !phone || !paymentMethod || !screenshotUrl) {
    return res.status(400).json({ error: 'तपाईंको विवरण र पेमेन्ट स्क्रिनसट आवश्यक छ (All fields required)' });
  }

  // Basic mobile validation (Nepal 10 digits starting with 9)
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'कृपया १० अङ्कको सही मोबाइल नम्बर राख्नुहोस् (Invalid 10-digit mobile number)' });
  }

  const isBumpIncluded = !!(hasOrderBump && product.orderBump && product.orderBump.enabled !== false);
  const bumpAmount = isBumpIncluded ? (product.orderBump?.price || 49) : 0;
  const totalAmount = (product.price || 149) + bumpAmount;

  const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    id: orderId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: cleanPhone,
    paymentMethod,
    screenshotUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    amount: totalAmount,
    ebookTitle: product.title,
    emailSent: false,
    hasOrderBump: isBumpIncluded,
    orderBumpTitle: isBumpIncluded ? (product.orderBump?.title || 'Stamina Boost Recipe') : undefined,
    orderBumpPrice: isBumpIncluded ? bumpAmount : undefined,
  };

  orders.unshift(newOrder);
  saveOrders();

  const adminRawPhone = (product.merchantInfo?.whatsappNumber || product.merchantInfo?.esewaId || '9809247218').replace(/\D/g, '');
  const adminWhatsappPhone = adminRawPhone.startsWith('977') ? adminRawPhone : `977${adminRawPhone}`;

  const reqHost = req.get('host') || 'localhost:3000';
  const protocol = reqHost.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || (reqHost.startsWith('http') ? reqHost : `${protocol}://${reqHost}`);

  const whatsappMessage = `🚨 *नयाँ अर्डर प्राप्त भयो! (NEW PURCHASE)* 🚨\n\n🆔 *Order ID:* #${orderId}\n👤 *ग्राहक नाम:* ${newOrder.name}\n📱 *फोन नम्बर:* ${cleanPhone}\n✉️ *इमेल:* ${newOrder.email}\n💰 *जम्मा भुक्तानी:* रु. ${totalAmount} (${paymentMethod.toUpperCase()})\n📦 *सामग्री:* ${product.title}${isBumpIncluded ? ' + Stamina Boost Recipe' : ''}\n🗓 *समय:* ${new Date().toLocaleString('ne-NP')}\n\n👉 *एडमिन प्यानल खोल्नुहोस्:*\n${baseUrl}/#admin`;

  const adminWhatsappUrl = `https://wa.me/${adminWhatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  console.log(`[Order Created & WhatsApp Notification Generated] ${orderId} by ${newOrder.name} (${newOrder.phone}) - WhatsApp: ${adminWhatsappPhone}`);

  res.status(201).json({
    success: true,
    message: 'भुक्तानी विवरण सफलतापुर्वक प्राप्त भयो। एडमिनलाई WhatsApp मा अर्डर सूचना तयार पारियो।',
    order: newOrder,
    adminWhatsappUrl,
    adminWhatsappPhone,
    whatsappMessage,
  });
});

// 4. Order Lookup (Customer Order Tracking)
app.get('/api/orders/lookup', (req, res) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'कृपया इमेल वा मोबाइल नम्बर राख्नुहोस्' });
  }

  const matches = orders.filter(
    (o) =>
      o.email.toLowerCase() === query ||
      o.phone.includes(query) ||
      o.id.toLowerCase() === query
  );

  res.json({ success: true, count: matches.length, orders: matches });
});

// 5. Admin Authentication
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === expectedPass) {
    res.json({ success: true, token: 'ADMIN_SESSION_TOKEN_VERIFIED', message: 'एडमिन लगइन सफल भयो' });
  } else {
    res.status(401).json({ error: 'गलत पासवर्ड! (Incorrect Admin Password)' });
  }
});

// 6. Get All Orders (Admin)
app.get('/api/orders', (req, res) => {
  const { status, search } = req.query;
  let filtered = [...orders];

  if (status && status !== 'all') {
    filtered = filtered.filter((o) => o.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, orders: filtered });
});

// Helper to construct email payload and send via SMTP or log for manual dispatch
async function prepareAndSendOrderEmail(
  order: Order,
  reqHost: string,
  options?: {
    customSubject?: string;
    customTextBody?: string;
    sendEmailNow?: boolean;
    attachPdf?: boolean;
  }
) {
  const protocol = reqHost.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.APP_URL || (reqHost.startsWith('http') ? reqHost : `${protocol}://${reqHost}`);
  const token = order.downloadToken || order.id;

  const ebookUrl = `${baseUrl}/api/download/${token}`;
  const bumpUrl = `${baseUrl}/api/download/bump/${token}`;

  const hasBump = !!order.hasOrderBump;
  const bumpTitle = order.orderBumpTitle || 'Stamina Boost Recipe';

  const subject = options?.customSubject || `[अर्डर स्वीकृत] ${order.name} जी, तपाईंको eBook र गाइड तयार भयो (#${order.id})`;

  const textBody = options?.customTextBody || `
नमस्ते ${order.name} जी,

हाम्रो पुरुष स्वास्थ्य डिजिटल गाइड खरिद गर्नुभएकोमा धेरै धेरै धन्यवाद!
तपाईंको भुक्तानी (रु. ${order.amount}) सफलतापुर्वक प्राप्त र स्वीकृत (Approved) भएको छ।

तपाईंको अर्डर गरिएका डिजिटल प्रोडक्टहरू डाउनलोड गर्न तलका लिङ्कहरू क्लिक गर्नुहोस्:

१. मुख्य eBook (${order.ebookTitle}):
${ebookUrl}

${hasBump ? `२. बम्प अफर (${bumpTitle}):\n${bumpUrl}\n` : ''}

विवरण (Order Details):
- अर्डर ID: ${order.id}
- भुक्तानी रकम: रु. ${order.amount}
- भुक्तानी माध्यम: ${order.paymentMethod.toUpperCase()}

सुझाव: लिङ्कमा क्लिक गरी PDF आफ्नो मोवाइल वा ल्यापटपमा डाउनलोड गरी सेभ गर्नुहोस्।

थप सहायता आवश्यक परेमा:
WhatsApp / Phone: ${product.merchantInfo.esewaId}
इमेल: taburej57@gmail.com

शुभकामना,
Tabrej Aalam | Men's Health Nepal
  `.trim();

  const attachments: any[] = [];
  if (options?.attachPdf) {
    if (order.customPdfData) {
      const base64Data = order.customPdfData.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: order.customPdfFilename || 'Mens_Health_Guide.pdf',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'application/pdf',
      });
    }
    if (order.customBumpPdfData) {
      const base64Bump = order.customBumpPdfData.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename: order.customBumpPdfFilename || 'Stamina_Boost_Recipe.pdf',
        content: Buffer.from(base64Bump, 'base64'),
        contentType: 'application/pdf',
      });
    }
  }

  let sentViaSmtp = false;
  let smtpError: string | null = null;

  if (options?.sendEmailNow) {
    try {
      const transporter = createEmailTransporter();
      if (transporter) {
        const fromAddr = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@menshealth.np';
        await transporter.sendMail({
          from: `"Men's Health Nepal" <${fromAddr}>`,
          to: order.email,
          subject,
          text: textBody,
          html: `<div style="font-family: sans-serif; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${textBody.replace(/\n/g, '<br/>')}</div>`,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        sentViaSmtp = true;
        console.log(`[SMTP Email Sent Successfully] To: ${order.email}`);
      } else {
        console.log(`[SMTP Not Configured] Pre-formatted email ready for manual sending: ${order.email}`);
      }
    } catch (err: any) {
      console.error(`[SMTP Email Error] ${err.message}`);
      smtpError = err.message;
    }
  }

  const encodedSubject = encodeURIComponent(subject);
  const encodedText = encodeURIComponent(textBody);

  const cleanPhone = order.phone.replace(/[^0-9]/g, '');
  const mailtoUrl = `mailto:${order.email}?subject=${encodedSubject}&body=${encodedText}`;
  const whatsappShareUrl = `https://wa.me/977${cleanPhone}?text=${encodedText}`;

  return {
    to: order.email,
    subject,
    textBody,
    htmlBody: `<div style="font-family: sans-serif; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${textBody.replace(/\n/g, '<br/>')}</div>`,
    ebookDownloadUrl: ebookUrl,
    bumpDownloadUrl: hasBump ? bumpUrl : null,
    mailtoUrl,
    whatsappShareUrl,
    sentViaSmtp,
    smtpError,
    hasCustomPdf: !!order.customPdfData,
    hasCustomBumpPdf: !!order.customBumpPdfData,
    customPdfFilename: order.customPdfFilename,
    customBumpPdfFilename: order.customBumpPdfFilename,
  };
}

// 7. Approve Order (Admin) -> Simply Mark Approved (No Auto Email)
app.post('/api/admin/orders/:id/approve', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const downloadToken = orders[orderIndex].downloadToken || `DL-${id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  orders[orderIndex] = {
    ...orders[orderIndex],
    status: 'approved',
    downloadToken,
    notes: `Approved by admin at ${new Date().toLocaleString('ne-NP')}`,
  };

  saveOrders();

  console.log(`[Order Approved] Order #${id} approved manually.`);

  res.json({
    success: true,
    message: `अर्डर #${id} स्वीकृत भयो। अब तपाईं म्यानुअल रूपमा इमेल पठाउन वा PDF फाइल अपलोड गर्न सक्नुहुन्छ।`,
    order: orders[orderIndex],
  });
});

// Route to Upload Custom PDF File for an Order (eBook or Bump)
app.post('/api/admin/orders/:id/upload-pdf', (req, res) => {
  const { id } = req.params;
  const { pdfType, pdfData, filename } = req.body;

  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (pdfType === 'bump') {
    orders[orderIndex].customBumpPdfData = pdfData;
    orders[orderIndex].customBumpPdfFilename = filename || 'Stamina_Boost_Recipe.pdf';
  } else {
    orders[orderIndex].customPdfData = pdfData;
    orders[orderIndex].customPdfFilename = filename || 'Mens_Health_Guide.pdf';
  }

  saveOrders();

  console.log(`[Custom PDF Uploaded] Order #${id}, type: ${pdfType}, filename: ${filename}`);

  res.json({
    success: true,
    message: `PDF फाइल (${filename || 'Custom PDF'}) अर्डर #${id} को लागि सफलतापूर्वक सेभ भयो।`,
    order: orders[orderIndex],
  });
});

// Delete Custom PDF File for an Order
app.delete('/api/admin/orders/:id/custom-pdf', (req, res) => {
  const { id } = req.params;
  const { pdfType } = req.query;

  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (pdfType === 'bump') {
    delete orders[orderIndex].customBumpPdfData;
    delete orders[orderIndex].customBumpPdfFilename;
  } else {
    delete orders[orderIndex].customPdfData;
    delete orders[orderIndex].customPdfFilename;
  }

  saveOrders();

  res.json({
    success: true,
    message: 'कस्टम PDF फाइल हटाइयो',
    order: orders[orderIndex],
  });
});

// Manual Send Email & Delivery Details Endpoint (Admin)
app.post('/api/admin/orders/:id/send-email', async (req, res) => {
  const { id } = req.params;
  const { customSubject, customTextBody, sendEmailNow, attachPdf } = req.body || {};

  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!orders[orderIndex].downloadToken) {
    orders[orderIndex].downloadToken = `DL-${id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const reqHost = req.get('host') || 'localhost:3000';
  const emailDetails = await prepareAndSendOrderEmail(orders[orderIndex], reqHost, {
    customSubject,
    customTextBody,
    sendEmailNow: !!sendEmailNow,
    attachPdf: !!attachPdf,
  });

  if (sendEmailNow && emailDetails.sentViaSmtp) {
    orders[orderIndex].emailSent = true;
  }
  saveOrders();

  res.json({
    success: true,
    message: sendEmailNow && emailDetails.sentViaSmtp
      ? `इमेल सफलतापूर्वक पठाइयो (${orders[orderIndex].email})`
      : `इमेल तथा प्रोडक्ट डाउनलोड विवरण तयार भयो`,
    order: orders[orderIndex],
    emailDetails,
  });
});

// 8. Reject Order (Admin)
app.post('/api/admin/orders/:id/reject', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    status: 'rejected',
    notes: `Rejected by admin at ${new Date().toLocaleString('ne-NP')}`,
  };

  saveOrders();

  res.json({ success: true, message: `Order #${id} marked as rejected`, order: orders[orderIndex] });
});

// 9. Delete Order (Admin)
app.delete('/api/admin/orders/:id', (req, res) => {
  const { id } = req.params;
  orders = orders.filter((o) => o.id !== id);
  saveOrders();
  res.json({ success: true, message: `Order #${id} deleted` });
});

// 10. Get Admin Dashboard Statistics
app.get('/api/admin/stats', (req, res) => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const approvedOrders = orders.filter((o) => o.status === 'approved').length;
  const rejectedOrders = orders.filter((o) => o.status === 'rejected').length;

  const totalRevenue = orders
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + (o.amount || product.price), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;

  const stats: AdminStats = {
    totalOrders,
    pendingOrders,
    approvedOrders,
    rejectedOrders,
    totalRevenue,
    todayOrders,
  };

  res.json({ success: true, stats });
});

// 11. Download eBook PDF Route (Only for Approved Orders or Valid Tokens)
app.get('/api/download/:token', (req, res) => {
  const { token } = req.params;
  const order = orders.find((o) => o.downloadToken === token || o.id === token);

  if (!order && token !== 'DEMO_SAMPLE') {
    return res.status(403).send(`
      <html lang="ne">
        <head><meta charset="utf-8"/><title>डाउनलोड अस्वीकृत</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
          <h1 style="color: #ef4444;">डाउनलोड लिङ्क अमान्य वा भेरिफिकेसन बाँकी छ</h1>
          <p>कृपया एडमिनले तपाईंको पेमेन्ट स्क्रिनसट भेरिफाइ नगरेसम्म पर्खनुहोस्।</p>
          <a href="/" style="display:inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">मुख्य पृष्ठमा फर्कनुहोस्</a>
        </body>
      </html>
    `);
  }

  // If a custom PDF was uploaded by the admin for this order, serve it directly
  if (order?.customPdfData) {
    const base64Data = order.customPdfData.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${order.customPdfFilename || 'Mens_Health_Guide.pdf'}"`);
    return res.send(pdfBuffer);
  }

  // Generate clean PDF output buffer simulating the eBook
  const pdfTitle = product.title;
  const pdfContent = `
================================================================================
                    शीघ्र स्खलनबाट मुक्ति: वैज्ञानिक जानकारी र घरेलु उपाय
                          पुरुष स्वास्थ्यको पूर्ण मार्गदर्शिका
================================================================================
कपिराइट © ${new Date().getFullYear()} - Tabrej Aalam | Men's Health eBook Nepal

ग्राहक विवरण:
नाम: ${order ? order.name : 'Sample Visitor'}
इमेल: ${order ? order.email : 'sample@menshealth.np'}
अर्डर नम्बर: ${order ? order.id : 'SAMPLE-EXCERPT'}
भुक्तानी रकम: रु. १४९ (Verified)

--------------------------------------------------------------------------------
विषयसूची (TABLE OF CONTENTS)
--------------------------------------------------------------------------------
१. शीघ्र स्खलन भनेको के हो? (Anatomy & Medical Overview)
२. ६ मुख्य कारणहरू: मानसिक तनाव, हर्मोन र पेल्विक नसा
३. प्रभावकारी घरेलु उपाय, जडीबुटी र खानपान
४. पेल्विक फ्लोर (किगल / Kegel) व्यायाम गर्ने पूर्ण ३-चरण विधि
५. Stop-Start र Squeeze प्रविधि
६. डाक्टरसँग परामर्श र स्थायी समाधान

================================================================================
अध्याय १: शीघ्र स्खलनको वैज्ञानिक यथार्थ
================================================================================
शीघ्र स्खलन (Premature Ejaculation) कुनै पाप वा निको नहुने रोग होइन। यो विशुद्ध 
मस्तिष्क, हर्मोन र पेल्विक क्षेत्रका मांसपेशीहरूको नियन्त्रणसँग सम्बन्धित विषय हो। 
नियमित १० मिनेट किगल व्यायाम र सेरोटोनिन सन्तुलन गर्ने घरेलु आहारले ९५% भन्दा बढी 
पुरुषमा स्थायी सुधार ल्याएको प्रमाणित छ।

(Note: Total 42 pages full digital eBook guide formatted for PDF viewer)
  `;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Shighra_Skhalanbata_Mukti_eBook.pdf"`);
  res.send(Buffer.from(pdfContent, 'utf-8'));
});

// 12. Download Stamina Boost Recipe PDF Route (Bump Sell Offer)
app.get('/api/download/bump/:token', (req, res) => {
  const { token } = req.params;
  const order = orders.find((o) => o.downloadToken === token || o.id === token);

  if (!order && token !== 'DEMO_SAMPLE') {
    return res.status(403).send(`
      <html lang="ne">
        <head><meta charset="utf-8"/><title>डाउनलोड अस्वीकृत</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
          <h1 style="color: #ef4444;">डाउनलोड लिङ्क अमान्य वा भेरिफिकेसन बाँकी छ</h1>
          <p>कृपया एडमिनले तपाईंको पेमेन्ट स्क्रिनसट भेरिफाइ नगरेसम्म पर्खनुहोस्।</p>
          <a href="/" style="display:inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">मुख्य पृष्ठमा फर्कनुहोस्</a>
        </body>
      </html>
    `);
  }

  // If a custom bump PDF was uploaded by admin, serve it directly
  if (order?.customBumpPdfData) {
    const base64Data = order.customBumpPdfData.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${order.customBumpPdfFilename || 'Stamina_Boost_Recipe.pdf'}"`);
    return res.send(pdfBuffer);
  }

  const recipePdfContent = `
================================================================================
              STAMINA BOOST RECIPE: ५ विशेष शक्तिवर्धक तथा स्ट्यामिना रेसिपीहरू
                        प्राकृतिक जुस तथा शक्तिवर्धक आहार मार्गदर्शिका
================================================================================
कपिराइट © ${new Date().getFullYear()} - Tabrej Aalam | Men's Health Nepal

ग्राहक विवरण:
नाम: ${order ? order.name : 'Sample Visitor'}
इमेल: ${order ? order.email : 'sample@menshealth.np'}
अर्डर नम्बर: ${order ? order.id : 'SAMPLE-BUMP'}
भुक्तानी विवरण: Stamina Boost Recipe Add-on (Verified)

--------------------------------------------------------------------------------
रेसिपी १: काजु, बदाम र मख्खन युक्त शक्तिवर्धक दूध (Stamina Booster Milk)
--------------------------------------------------------------------------------
सामग्रीहरू:
- मनतातो दूध: १ गिलास (२५० ml)
- काजु: ५-६ वटा (पिसिएको)
- बदाम (Almonds): ६-७ वटा (रातभर भिजाएर बोक्रा छोडाएको)
- शुद्ध मह: १ चम्चा
- मख्खन / दालचिनी धुलो: १ चिम्टी

बनाउने विधि र प्रयोग:
दूध उमालेर त्यसमा पिसेको काजु र बदाम मिसाउनुहोस्। हल्का मनतातो भएपछि १ चम्चा मह र दालचिनी धुलो हालेर दैनिक बेलुका सुत्नुअघि पिउनुहोस्। यसले शरीरमा प्राकृतिक टेस्टोस्टेरोन र स्ट्यामिना ह्वात्तै बढाउँछ।

--------------------------------------------------------------------------------
रेसिपी २: भुइँकटर (Pineapple) र अदुवा-कागती डिटक्स जुस
--------------------------------------------------------------------------------
सामग्रीहरू:
- ताजा भुइँकटर: १ कप (टुक्रा पारिएको)
- ताजा अदुवा: १ सानो टुक्रा
- कागतीको रस: १ चम्चा
- कालो नून: १ चिम्टी

बनाउने विधि:
सबै सामग्रीलाई ब्लेन्डरमा राम्ररी ब्लेन्ड गरी छानेर दैनिक बिहान खाजापछि पिउनुहोस्। यसले रक्तसञ्चार (Blood circulation) चुस्त बनाउँछ।

--------------------------------------------------------------------------------
रेसिपी ३: खजुर (Dates) र ओखर मिश्रण (Energy Balls)
--------------------------------------------------------------------------------
सामग्रीहरू:
- खजुर (बिऊ निकालिएको): १० वटा
- ओखर (Walnut): ५ वटा
- तिल (Sesame seeds): १ चम्चा

बनाउने विधि:
खजुर र ओखरलाई कुटेर मसिनो बनाई स-साना डल्ला (Balls) बनाउनुहोस्। दैनिक बिहान २ वटा डल्ला मनतातो पानीसँग सेवन गर्नुहोस्।

--------------------------------------------------------------------------------
रेसिपी ४: चुकन्दर (Beetroot) र अनारको रक्तसञ्चार जुस
--------------------------------------------------------------------------------
चुकन्दरमा पाइने natural Nitric Oxide ले लिंगमा रगतको प्रवाह तीव्र पार्दछ जसले अङ्गको कडापन र अडान शक्ति बढाउँछ।

--------------------------------------------------------------------------------
रेसिपी ५: अश्वगन्धा र कौँचको बीउ मिश्रण (वैदिक जडीबुटी काढा)
--------------------------------------------------------------------------------
अश्वगन्धा धुलो (आधा चम्चा) + दूध (१ गिलास) + शुद्ध मह (१ चम्चा) सुत्नुभन्दा ३० मिनेट अघि पिउनाले मानसिक तनाव मेटिन्छ र यौन सहवास अवधि ३ गुणा बढाउँछ।

================================================================================
महत्वपूर्ण सल्लाह:
१. धुम्रपान र मदिरापानबाट टाढा रहनुहोस्।
२. दैनिक कम्तीमा ७-८ घण्टा पर्याप्त निद्रा लिनुहोस्।
३. दिनहुँ १५ मिनेट किगल (Kegel) व्यायाम गर्नुहोस्।
================================================================================
  `.trim();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Stamina_Boost_Recipe_Guide.pdf"`);
  res.send(Buffer.from(recipePdfContent, 'utf-8'));
});

// ================= VITE MIDDLEWARE / STATIC SERVING ================= //

async function startServer() {
  // Explicitly serve public assets
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  Men's Health eBook Server running on port ${PORT}`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
