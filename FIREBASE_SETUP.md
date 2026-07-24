# Firebase Firestore & Storage Integration Guide

This application is pre-configured to sync seamlessly with Firebase Firestore, Firebase Authentication, and Firebase Storage.

---

## 1. Firebase Collections Schema

### Collection: `orders`
```json
{
  "id": "ORD-84912",
  "name": "Ramesh Shrestha",
  "email": "ramesh@example.com",
  "phone": "9841234567",
  "paymentMethod": "esewa",
  "screenshotUrl": "https://firebasestorage.googleapis.com/...",
  "status": "pending",
  "createdAt": "2026-07-22T04:30:00.000Z",
  "amount": 149,
  "ebookTitle": "शीघ्र स्खलनबाट मुक्ति",
  "downloadToken": "DL-ORD-84912-SECURE",
  "emailSent": false
}
```

### Collection: `products`
```json
{
  "id": "mens-health-ebook-np-01",
  "title": "शीघ्र स्खलनबाट मुक्ति: वैज्ञानिक जानकारी र घरेलु उपाय",
  "subtitle": "शीघ्र स्खलन: कारण, समाधान र उपचार",
  "price": 149,
  "originalPrice": 600,
  "coverImageUrl": "https://firebasestorage.googleapis.com/...",
  "pdfUrl": "https://firebasestorage.googleapis.com/..."
}
```

---

## 2. Setting Up Firebase

1. Create a Firebase Project at [https://console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** in test or production mode.
3. Enable **Firebase Storage** for payment screenshot images.
4. Copy your Web App credentials into `.env`:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```
