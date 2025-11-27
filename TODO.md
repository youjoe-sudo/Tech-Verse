# Migration to MongoDB for Vercel Deployment

## Steps to Complete:

1. **Set up MongoDB Atlas**:
   - Go to https://www.mongodb.com/atlas and create a free account.
   - Create a new cluster (free tier).
   - Create a database user with read/write permissions.
   - Get the connection string (replace <password> with your user's password).
   - Whitelist your IP (or 0.0.0.0/0 for all).

2. **Update Environment Variables**:
   - In Vercel dashboard, go to your project settings > Environment Variables.
   - Add `MONGODB_URI` with your MongoDB connection string.

3. **Code Changes**:
   - Install mongoose (already done).
   - Update server.js to use MongoDB instead of JSON files.
   - Create models for Meeting, News, Contact.

4. **Create vercel.json**:
   - Configure Vercel to handle the Express app as serverless functions.

5. **Deploy to Vercel**:
   - Push changes to GitHub.
   - Vercel will redeploy automatically.

6. **Test**:
   - Verify admin page can add meetings/news and data persists.
