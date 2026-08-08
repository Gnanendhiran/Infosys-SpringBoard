# CareerAlign AI - Deployment Guide

## Deploy to Vercel (Free)

Follow these steps to deploy your application:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **careeralign-ai** (or your choice)
- Directory? **./** (just press Enter)
- Override settings? **N**

### 4. Add Environment Variables

After deployment, add your environment variables in the Vercel dashboard:

1. Go to your project on [vercel.com](https://vercel.com)
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_FIREBASE_API_KEY=AIzaSyBdkppWiwhqCrk9sZ1vdlA-kKNpco36nA4
VITE_FIREBASE_AUTH_DOMAIN=careeralign-3406a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=careeralign-3406a
VITE_FIREBASE_STORAGE_BUCKET=careeralign-3406a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=210778728218
VITE_FIREBASE_APP_ID=1:210778728218:web:471b45f25112cf410d6ea3

VITE_SUPABASE_URL=https://maktglceegodkkbgxgdq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ha3RnbGNlZWdvZGtrYmd4Z2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzY1MjgsImV4cCI6MjA3OTM1MjUyOH0.-vfgmMJ6V7Eq4pEMIxqq824Ql0N1DqFzbvxIVongsuI
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ha3RnbGNlZWdvZGtrYmd4Z2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc3NjUyOCwiZXhwIjoyMDc5MzUyNTI4fQ.ZyTcCmcRAZqxWm7oXUtW_XLonNAY2jvlM-xTwpd3JBU
VITE_SUPABASE_STORAGE_BUCKET=resumes
```

4. **Important**: Set these for all environments (Production, Preview, Development)

### 5. Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

Your site will be live at: `https://your-project-name.vercel.app`

## Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables (same as above)
6. Deploy!

## Update Firebase Authorized Domains

After deployment, add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain: `your-project-name.vercel.app`

---

That's it! Your application is now deployed and accessible worldwide. 🚀
