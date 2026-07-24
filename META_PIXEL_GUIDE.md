# Meta Pixel Integration Guide

## Overview

Meta Pixel (Facebook Pixel) tracking is integrated via `/lib/metaPixel.ts`.

---

## Configuration

Set your Pixel ID in `.env`:

```env
VITE_META_PIXEL_ID="YOUR_ACTUAL_META_PIXEL_ID"
```

---

## Events Tracked

- `PageView`: Fired automatically when visitors land on the website.
- `ViewContent`: Fired when visitors view topic details or read the free sample excerpt.
- `InitiateCheckout`: Fired when a customer opens the payment modal.
- `Purchase`: Fired when a customer submits their order and uploads a payment screenshot (Value: Rs. 149 NPR).
- `Lead`: Fired on customer registration or inquiry.

---

## Testing Meta Pixel

Use the **Meta Pixel Helper** Chrome Extension to verify live events during checkout.
