# Railway Deployment Guide

Complete step-by-step guide to deploy FamilyHealthCare on Railway.

## Prerequisites

1. **Railway Account**: https://railway.app (sign up free)
2. **GitHub Account**: Code must be on GitHub
3. **MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas (free tier available)
4. **Gemini API Key**: https://makersuite.google.com/app/apikey (free tier available)

## Step 1: Prepare Code for Deployment

### 1.1 Update Backend Configuration

Edit `Family_Health_Care_WebApp/Backend/server/index.js`:
```javascript
// Ensure this is set correctly:
const PORT = process.env.PORT || 5000;
```

### 1.2 Update API Base URL (Frontend)

The frontend will auto-detect the API URL from the Railway deployment domain. No changes needed if using the default approach.

## Step 2: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a new project
4. Build a cluster (shared tier, free)
5. Create a database user:
   - Username: `railwayuser`
   - Password: Generate strong password
   - Save these credentials!
6. Get connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy MongoDB+SRV connection string
   - Replace `<username>` and `<password>` with your credentials

**Example URL**:
```
mongodb+srv://railwayuser:password123@cluster0.abc123.mongodb.net/family_healthcare?retryWrites=true&w=majority
```

## Step 3: Push to GitHub

```bash
# Initialize git (if not already done)
cd Major_Project
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial FamilyHealthCare deployment"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/familycare.git

# Push to GitHub
git push -u origin main
```

## Step 4: Deploy on Railway

### 4.1 Create Railway Project

1. Go to https://railway.app
2. Click "Start New Project"
3. Select "Deploy from GitHub repo"
4. Select your FamilyHealthCare repository
5. Railway automatically detects it's a Node.js project

### 4.2 Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
MONGODB_URI=mongodb+srv://railwayuser:password123@cluster0.abc123.mongodb.net/family_healthcare?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_12345
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

**Generate Strong Values**:

For JWT_SECRET, use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.3 Configure Build & Start Commands

In Railway **Settings**:

**Start Command**:
```
node Family_Health_Care_WebApp/Backend/server/index.js
```

**Build Command** (if needed):
```
cd Family_Health_Care_WebApp/Backend/server && npm install && cd ../../Frontend/client && npm install && npm run build
```

## Step 5: Configure MongoDB Atlas Security

### 5.1 IP Whitelist

1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Click "Add IP Address"
4. Select "Allow access from anywhere" (0.0.0.0/0)
   - ⚠️ For production, use specific Railway IP: Check Railway dashboard for IP
5. Confirm

### 5.2 Database Access

1. Go to "Database Access"
2. Create user `railwayuser` (already done above)
3. Grant all roles (or specific roles for security)

## Step 6: Deploy

1. In Railway, click "Deploy"
2. Wait for deployment to complete (2-5 minutes)
3. View deployment logs in Railway dashboard
4. Once complete, click on your project to get the public URL

**Your app is now live at**: `https://your-project-name.up.railway.app`

## Step 7: Seed Demo Data (Optional)

To add demo users and data:

1. In Railway dashboard, open "Shell" or SSH:
   ```bash
   cd Family_Health_Care_WebApp/Backend/server
   node seed/seedDemoData.js
   ```

2. Check the output for demo credentials file location

## Step 8: Configure Frontend API URL

If frontend is separate (optional advanced setup):

In frontend `.env`:
```
VITE_API_BASE_URL=https://your-project-name.up.railway.app
```

## Testing Your Deployment

1. **Access website**: https://your-project-name.up.railway.app
2. **Register account**: Create new user
3. **Login**: Use credentials
4. **Test features**:
   - Upload a file
   - Book appointment
   - View profile
   - Check prescriptions

## Post-Deployment Checklist

- [ ] MongoDB Atlas IP whitelist configured
- [ ] All environment variables set in Railway
- [ ] Backend logs show "MongoDB connected" and "Server running"
- [ ] Frontend accessible and API calls work
- [ ] Demo data seeded (optional)
- [ ] Test login/registration
- [ ] Test file upload
- [ ] Check dark/light theme
- [ ] Verify appointments work
- [ ] Test on mobile

## Common Issues & Solutions

### "MongoDB connection timeout"
- Check MONGODB_URI in variables
- Verify IP whitelist in Atlas
- Test local connection string first

### "Cannot find module"
- Ensure all dependencies installed
- Check for typos in import paths
- Rebuild and redeploy

### "Port already in use"
- Railway automatically assigns PORT
- Don't hardcode port in code
- Use `process.env.PORT || 5000`

### "Out of memory"
- May occur with OCR on large images
- Increase Railway's memory allocation
- Or reduce image file size limit

### Frontend not connecting to backend
- Check VITE_API_BASE_URL
- Ensure CORS is enabled
- Check network tab in DevTools

## Monitoring & Logs

In Railway dashboard:

1. **Logs**: View real-time application logs
2. **Metrics**: CPU, memory, network usage
3. **Deployments**: View all past deployments
4. **Settings**: Modify environment variables
5. **Domains**: View your public URL

## Updating Code

To push updates:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Railway automatically redeploys from GitHub!

## Backup & Data Management

MongoDB Atlas provides:
- Automatic daily backups (free tier)
- Point-in-time restore
- Snapshots

Export data (if needed):
```bash
# From local machine
mongodump --uri "mongodb+srv://user:password@cluster.mongodb.net/family_healthcare"
```

## Security Best Practices

1. ✅ Use strong JWT_SECRET
2. ✅ Use strong MongoDB password
3. ✅ Enable IP whitelist in Atlas
4. ✅ Don't commit .env files
5. ✅ Use HTTPS (automatic with Railway)
6. ✅ Regular backups (automatic with Atlas)
7. ✅ Monitor logs for errors

## Performance Optimization

For production:

1. **Frontend**: Already optimized with Vite
2. **Backend**: Node.js clusters (optional)
3. **Database**: Add indexes (already done)
4. **Caching**: Can add Redis later
5. **CDN**: Railway provides global edge

## Support & Next Steps

- Monitor Railway dashboard regularly
- Set up error alerts (optional)
- Plan for scaling (Traffic/Database upgrades)
- Consider automated backups
- Set up CI/CD pipeline (optional)

---

**Deployment successful! Your FamilyHealthCare app is now live on Railway.** 🚀
