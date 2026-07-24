# Admin Panel Setup & Operations Guide

## Overview

The Admin Panel gives you complete control over order verification, customer fulfillment, and product pricing.

---

## 1. How to Login

1. Click on **Admin** or the Lock icon in the header or footer of the application.
2. Enter the admin password.
   - **Default Password**: `admin123`
   - **Custom Password**: Set the `ADMIN_PASSWORD` environment variable in `.env`.

---

## 2. Admin Capabilities

### 📊 Dashboard Metrics
- **Total Orders**: All orders created.
- **Pending Verification**: Orders awaiting your screenshot check.
- **Approved Orders**: Orders verified and fulfilled.
- **Total Revenue**: Total sum of approved order amounts (Rs.).
- **Today's Orders**: Orders submitted today.

### 🔍 Order Verification Workflow
1. Open the **अर्डर सूची (Orders)** tab.
2. Click **View Screenshot** to inspect the customer's uploaded eSewa or Khalti payment screenshot.
3. Check the transaction ID and amount (Rs. 149 sent to `9809247218 - Tabrej Aalam`).
4. Click **Approve & Send Email**:
   - Updates order status to `Approved`.
   - Generates a unique secure PDF download token (`DL-ORD-xxxxx`).
   - Automatically delivers the eBook download link to the customer's email.
5. If the payment is invalid or missing, click **Reject**.

### 📥 Export CSV
Click **Export CSV** to download a spreadsheet containing customer names, emails, mobile numbers, payment methods, and statuses for accounting and CRM records.

### ✏️ Product & Price Management
Under the **प्रोडक्ट र मूल्य सम्पादन** tab, you can update:
- eBook Title & Subtitle
- Offer Price (e.g. Rs. 149) & Original Price (e.g. Rs. 600)
- eSewa ID / Khalti ID (default: `9809247218`)
- Merchant Account Name (default: `Tabrej Aalam`)
