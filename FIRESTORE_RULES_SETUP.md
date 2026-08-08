# Firestore Security Rules Setup

## Issue Fixed

The HR Dashboard was getting "Missing or insufficient permissions" errors when trying to load resumes. This was because Firestore security rules needed to allow collection queries for recruiters.

## Changes Made

1. **Added `list` permission** to the resumes collection to allow collection queries
2. **Optimized recruiter check** to verify profile exists before reading

## Deploying the Rules

You need to deploy the updated `firestore.rules` file to Firebase:

### Option 1: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the rules
firebase deploy --only firestore:rules
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## How the Rules Work

### For Resumes Collection:

- **Read**: Users can read their own resumes OR recruiters can read all resumes
- **List**: All authenticated users can query the collection (individual access controlled by read rule)
- **Create**: Users can only create resumes with their own user_id
- **Update/Delete**: Users can update/delete their own resumes OR recruiters can update/delete any resume

### For Recruiters:

The `isRecruiter()` function checks:
1. User is authenticated
2. Profile document exists
3. Profile has `user_type == 'recruiter'`

## Testing

After deploying:
1. Log in as a recruiter/HR user
2. Go to HR Dashboard
3. Resumes should load without permission errors

## Troubleshooting

If you still get permission errors:

1. **Verify profile exists**: Make sure the user has a profile document in Firestore with `user_type: 'recruiter'`
2. **Check user authentication**: Ensure the user is properly authenticated
3. **Verify rules deployed**: Check Firebase Console to confirm rules are published
4. **Check browser console**: Look for specific error messages

## Creating Firestore Indexes

If you get index errors, create the required index:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click the link in the error message to create the index automatically
3. Or manually create an index on `resumes` collection with:
   - Field: `uploaded_at` (Descending)
   - Query scope: Collection


