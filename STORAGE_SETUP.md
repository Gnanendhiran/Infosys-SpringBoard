# Storage Setup Guide

This project uses **Supabase Storage** instead of Firebase Storage for file uploads.

## Environment Variables Required

Add these to your `.env` file:

```env
# Supabase Configuration (for Storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Storage Bucket Setup

The storage bucket `resumes` should already be created via migrations. If not:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `resumes`
3. Set it to **Private** (not public)
4. Configure RLS policies (already set up in migrations)

## How It Works

- **Authentication**: Uses Firebase Auth (existing setup)
- **Storage**: Uses Supabase Storage (new)
- **Database**: Uses Firestore (existing setup)

The storage service automatically:
- Uploads files to Supabase Storage
- Returns public URLs for uploaded files
- Handles authentication via Firebase tokens

## Migration Notes

- All file uploads now go to Supabase Storage
- File paths remain the same format: `userId/timestamp_filename.pdf`
- Existing Firebase Storage files are not migrated automatically


