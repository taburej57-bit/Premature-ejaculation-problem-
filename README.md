# Men's Health eBook (शीघ्र स्खलनबाट मुक्ति) Digital Product Platform

Production-ready digital sales platform and eBook landing page for selling the Nepali Men's Health eBook on शीघ्र स्खलनबाट मुक्ति: वैज्ञानिक जानकारी र घरेलु उपाय.

---

## 🚀 Key Features

- **Landing Page**: High-converting medical blue & white theme, 3D eBook mockup, trust badges, instant discount pill (Rs. 600 -> Rs. 149).
- **Core Topics Covered**:
  - कारण (Causes: Psychological, Hormonal, Physical)
  - घरेलु उपाय (Natural & Home Remedies)
  - वैज्ञानिक जानकारी (Medical Science & Insights)
  - जीवनशैली (Lifestyle & Diet Blueprint)
  - व्यायाम (Pelvic Floor & Kegel Exercises with illustrations)
  - उपचार (Clinical Treatments & Therapies)
- **Payment & Checkout**:
  - eSewa ID: `9809247218` (Tabrej Aalam)
  - Khalti ID: `9809247218` (Tabrej Aalam)
  - Live generated QR Codes
  - Payment Screenshot Upload with preview
  - Order ID & status tracking
- **Admin Panel**:
  - Protected Admin Login (Default: `admin123`)
  - Order Stats (Total Orders, Pending, Approved, Rejected, Revenue Rs., Today's Orders)
  - Order Management: **Approve & Send Email**, **Reject**, **Delete**
  - **Export CSV** order list
  - Live Product & Price Editor
  - HTML Email Template Previewer
- **Order Verification & Fulfillment**:
  - Admin approves payment screenshot before eBook PDF is delivered.
  - Prevents unauthorized downloads from fake submissions.
  - Automatic download link generated upon approval.
- **Analytics & Tracking**:
  - Meta Pixel (`lib/metaPixel.ts`) tracking `PageView`, `ViewContent`, `InitiateCheckout`, `Purchase`, `Lead`.
  - Google Analytics 4 support (`lib/analytics.ts`).

---

## 🛠️ Project Structure

```
├── server.ts                 # Full-stack Express backend & API endpoints
├── data/
│   ├── orders.json           # Persistent order store
│   └── product.json          # Persistent product store
├── lib/
│   ├── metaPixel.ts          # Facebook / Meta Pixel SDK & event tracker
│   └── analytics.ts          # Google Analytics 4 integration
├── src/
│   ├── App.tsx               # Main React Application Container
│   ├── types.ts              # Shared TypeScript Interfaces
│   ├── data/
│   │   └── initialData.ts    # Initial eBook metadata, topics, reviews, FAQs
│   └── components/
│       ├── Header.tsx        # Navigation Header
│       ├── Hero.tsx          # Hero section with 3D eBook mockup & CTA
│       ├── Benefits.tsx      # 6 Core Topics cards
│       ├── WhyChoose.tsx     # Medical trust factors
│       ├── Reviews.tsx       # Customer reviews & ratings
│       ├── FAQ.tsx           # Accordion FAQ
│       ├── SamplePreview.tsx # Free excerpt reader modal
│       ├── CheckoutModal.tsx # eSewa/Khalti checkout modal with QR code & upload
│       ├── OrderStatusModal.tsx # Customer order status lookup
│       ├── AdminPanel.tsx    # Admin dashboard & verification engine
│       └── Footer.tsx        # Footer with medical disclaimer
```

---

## 🏃 Local Development

```bash
# Install dependencies
npm install

# Start full-stack development server on port 3000
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables (`.env`)

See `.env.example` for reference:

```env
ADMIN_PASSWORD="admin123_secure_password"
VITE_META_PIXEL_ID="YOUR_META_PIXEL_ID"
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## 📄 Documentation Guides

- [Admin Setup Guide](./ADMIN_SETUP.md)
- [Firebase Integration Guide](./FIREBASE_SETUP.md)
- [Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)
- [Meta Pixel Integration Guide](./META_PIXEL_GUIDE.md)
