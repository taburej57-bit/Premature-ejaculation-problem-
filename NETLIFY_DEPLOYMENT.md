# Netlify Deployment Guide

This project is fully ready for deployment on Netlify or Node.js cloud environments.

---

## Deploying to Netlify

### Method 1: Netlify CLI
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Build the production application:
   ```bash
   npm run build
   ```
3. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Method 2: Git Repository Integration
1. Push your project to GitHub / GitLab.
2. In Netlify Dashboard, click **Add new site** -> **Import an existing project**.
3. Set the build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables in Netlify Settings (`ADMIN_PASSWORD`, `VITE_META_PIXEL_ID`, `VITE_GA_MEASUREMENT_ID`).
5. Click **Deploy Site**.
