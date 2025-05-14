# Firestore Security Rules

This directory contains security rules for Firestore that control read/write access to your database.

## Deploying Rules

To deploy these rules to your Firebase project, you'll need the Firebase CLI. If you don't have it installed, run:

```bash
npm install -g firebase-tools
```

Then, make sure you're logged in:

```bash
firebase login
```

To deploy the rules:

1. Initialize your project (if you haven't already):
   ```bash
   firebase init firestore
   ```

2. Copy the contents of `firestore.rules` to the generated `firestore.rules` file in your project root.

3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Important Notes

- The included rules ensure organizations can access their own issues
- Rules are set up to check both the `isOrganization` field and the `role` field
- Make sure your auth tokens have proper custom claims set for organizations

## Rules Explanation

These rules implement the following permissions:

- Organizations can read/write their own data and issues assigned to them
- Regular users can read/write their own profile data
- Users can create issues and update/delete their own issues
- Issues are readable by any authenticated user 