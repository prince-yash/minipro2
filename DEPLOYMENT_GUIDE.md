# EduCanvas Live - Complete Deployment Guide

This guide covers deploying EduCanvas Live to Render with video call fixes and database authentication.

## What's New

### Video Call Fixes for Production
- ✅ **Dynamic PeerJS Connection**: Now uses environment-based backend URL instead of hardcoded localhost:5000
- ✅ **TURN Servers**: Added free TURN servers for NAT traversal (fixes video call issues behind firewalls)
- ✅ **Production-Ready WebRTC**: Video calls now work properly on Render deployment

### Database Authentication
- ✅ **PostgreSQL Database**: User accounts with persistent storage
- ✅ **JWT Authentication**: Secure token-based authentication (7-day expiry)
- ✅ **Login/Register**: New AuthPage component with beautiful UI
- ✅ **Password Security**: Bcrypt password hashing
- ✅ **User Roles**: Support for students and teachers/admins

## Prerequisites

1. **GitHub Account** with your code repository
2. **Render Account** (free tier available at [render.com](https://render.com))
3. Your code pushed to GitHub

## Quick Deploy (Recommended)

### Option 1: Blueprint Deployment

This automatically sets up backend, frontend, and PostgreSQL database.

1. **Push to GitHub**:
   ```bash
   cd /home/yash/projects/educanvas-live
   git add .
   git commit -m "Add authentication and fix video calls for production"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository
   - Click **"Apply"**

3. **Services Created**:
   - `educanvas-backend`: Backend API (Node.js)
   - `educanvas-frontend`: React app (Static site)
   - `educanvas-db`: PostgreSQL database

4. **Wait for Deployment** (5-10 minutes):
   - Backend will install packages, run migrations, and start
   - Frontend will build React app
   - Database will be provisioned

5. **Access Your App**:
   - Find your frontend URL in Render dashboard
   - Open it in browser
   - Register a new account and start teaching!

### Option 2: Manual Deployment

#### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `educanvas-db`
   - **Database**: `educanvas`
   - **User**: `educanvas_user`
   - **Region**: `Oregon` (or your preferred region)
   - **Plan**: `Starter` (free tier - 1GB storage)
3. Click **"Create Database"**
4. Wait for provisioning (1-2 minutes)
5. Copy the **Internal Database URL** for later

#### Step 2: Deploy Backend

1. Go to Dashboard → **"New"** → **"Web Service"**
2. Connect GitHub → Select repository
3. Configure:
   - **Name**: `educanvas-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (free tier)
   - **Region**: Same as database (e.g., Oregon)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   USE_HTTPS=false
   ADMIN_CODE=your-secure-admin-code-here
   DATABASE_URL=[paste internal database URL from Step 1]
   JWT_SECRET=[generate a random string, e.g., openssl rand -base64 32]
   ```

5. **Health Check Path**: `/health`
6. Click **"Create Web Service"**
7. Wait for deployment (3-5 minutes)
8. Copy your backend URL (e.g., `https://educanvas-backend.onrender.com`)

#### Step 3: Deploy Frontend

1. Go to Dashboard → **"New"** → **"Static Site"**
2. Connect GitHub → Same repository
3. Configure:
   - **Name**: `educanvas-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`
   - **Plan**: `Starter` (free tier)
   - **Region**: Same as backend

4. **Environment Variables**:
   ```
   NODE_ENV=production
   GENERATE_SOURCEMAP=false
   REACT_APP_BACKEND_URL=[paste backend URL from Step 2]
   ```

5. Click **"Create Static Site"**
6. Wait for build (3-5 minutes)
7. Copy your frontend URL

#### Step 4: Update Backend CORS

1. Go back to your backend service
2. Add environment variable:
   ```
   FRONTEND_URL=[paste frontend URL from Step 3]
   ```
3. Save changes (backend will redeploy)

## Testing Your Deployment

### 1. Test Backend Health
```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "users": 0,
  "admin": "none"
}
```

### 2. Test Frontend

1. Open your frontend URL
2. You should see the **Login/Register** page

### 3. Register an Account

1. Click **"Register"** tab
2. Fill in:
   - Email: your.email@example.com
   - Username: your_username
   - Password: (min 6 characters)
   - Confirm Password
   - Role: Student or Teacher/Admin
3. Click **"Create Account"**
4. You should be logged in automatically

### 4. Join Classroom

1. After login, you'll see the landing page
2. Enter your name (pre-filled from username)
3. If you registered as admin, enter the admin code from your environment variables
4. Click **"Join Classroom"**

### 5. Test Video Call

1. In classroom, click **"Launch"** button
2. Allow camera and microphone access
3. Your video should appear
4. Open another browser window (incognito/private)
5. Register another account and join the same classroom
6. Start video call on second user
7. Both users should see each other's video!

## Features Available

### For Everyone
- ✅ Register account with email
- ✅ Login with email or username
- ✅ Persistent user profile
- ✅ Join classroom
- ✅ Chat with other participants
- ✅ Video conference with multiple users
- ✅ Drawing on whiteboard
- ✅ See other users' drawings in real-time

### For Admins/Teachers
- ✅ All student features plus:
- ✅ Clear canvas
- ✅ Toggle drawing permissions
- ✅ Delete chat messages
- ✅ Kick users from session
- ✅ Screen sharing
- ✅ Control user permissions

## Troubleshooting

### Video Call Not Working

**Issue**: Can't see remote user's video

**Solutions**:
1. Check REACT_APP_BACKEND_URL is set correctly in frontend
2. Verify both users are on HTTPS (Render provides this automatically)
3. Check browser console for errors
4. Try different browsers (Chrome/Edge recommended)
5. Check firewall settings

**If still not working**:
- The TURN servers we added should handle most NAT/firewall issues
- If you need better quality, consider signing up for a dedicated TURN service:
  - [Twilio TURN](https://www.twilio.com/stun-turn)
  - [Metered TURN](https://www.metered.ca/tools/openrelay/)

### Database Connection Error

**Issue**: Backend shows "Failed to connect to database"

**Solutions**:
1. Check DATABASE_URL is correctly set
2. Verify database is running (green status in Render dashboard)
3. Make sure backend and database are in same region
4. Check Prisma migration ran successfully in build logs

### Authentication Not Working

**Issue**: Login/Register fails

**Solutions**:
1. Check JWT_SECRET is set in backend environment variables
2. Verify DATABASE_URL is correct
3. Check backend logs for specific errors
4. Ensure migrations ran successfully

### Build Failures

**Backend Build Error**:
```bash
# Check logs for:
- Prisma generate errors → Make sure DATABASE_URL is set
- Migration errors → Check migration files are committed to git
- Dependency errors → Verify package.json is correct
```

**Frontend Build Error**:
```bash
# Common issues:
- Missing REACT_APP_BACKEND_URL → Add to environment variables
- TypeScript errors → Check all components compile locally first
```

## Environment Variables Reference

### Backend (.env or Render Environment)
```bash
NODE_ENV=production                          # Required
PORT=5000                                    # Auto-set by Render
USE_HTTPS=false                              # Required (Render handles SSL)
DATABASE_URL=postgresql://...                # Required (from database service)
JWT_SECRET=your-secret-key-here             # Required (generate random string)
ADMIN_CODE=teach123                          # Optional (default: teach123)
FRONTEND_URL=https://your-frontend.onrender.com  # Required for CORS
RENDER_EXTERNAL_URL=https://your-backend.onrender.com  # Auto-set by Render
```

### Frontend (.env or Render Environment)
```bash
NODE_ENV=production                                      # Required
GENERATE_SOURCEMAP=false                                 # Optional (reduces build size)
REACT_APP_BACKEND_URL=https://your-backend.onrender.com  # Required
```

## Local Development

### Setup Local Database

1. **Install PostgreSQL** (if not installed):
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS (with Homebrew)
   brew install postgresql
   brew services start postgresql
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE educanvas;
   CREATE USER educanvas_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE educanvas TO educanvas_user;
   \q
   ```

3. **Update Backend .env**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   DATABASE_URL="postgresql://educanvas_user:your_password@localhost:5432/educanvas"
   JWT_SECRET="local-dev-secret-key"
   ```

4. **Run Migrations**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development**:
   ```bash
   # From project root
   npm run dev
   
   # Or separately:
   # Terminal 1 (backend)
   cd backend && npm run dev
   
   # Terminal 2 (frontend)
   cd frontend && npm start
   ```

6. **Access Locally**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Test video calls by opening multiple browser windows

## Database Management

### View Database
```bash
cd backend
npx prisma studio
```
Opens a web interface at http://localhost:5555 to view/edit data

### Create New Migration
```bash
cd backend
# After editing prisma/schema.prisma:
npx prisma migrate dev --name your_migration_name
```

### Reset Database (Development Only!)
```bash
cd backend
npx prisma migrate reset
```

## Security Best Practices

1. **Change Admin Code**:
   - Update `ADMIN_CODE` in Render environment variables
   - Use a strong, random code

2. **Secure JWT Secret**:
   ```bash
   # Generate secure secret:
   openssl rand -base64 64
   ```
   - Use the generated value for `JWT_SECRET`

3. **HTTPS Only**:
   - Render provides automatic HTTPS
   - Never disable it in production

4. **Database Security**:
   - Use Render's internal database URL
   - Never expose database credentials

5. **Password Policy**:
   - Current minimum: 6 characters
   - Consider increasing to 8+ for production
   - Edit in `backend/auth.js` line 30

## Performance Tips

### Free Tier Limitations

1. **Cold Starts** (services sleep after 15min inactivity):
   - First request takes 30-60 seconds
   - Consider paid tier for production use

2. **Keep Services Active**:
   - Use uptime monitoring services (e.g., UptimeRobot)
   - Ping health endpoint every 10 minutes

3. **Database Storage**:
   - Free tier: 1GB storage
   - Monitor usage in Render dashboard
   - Delete old test accounts periodically

### Optimization

1. **Reduce Build Time**:
   - Enable caching in Render settings
   - Use `npm ci` instead of `npm install`

2. **Improve Video Quality**:
   - Upgrade to paid TURN service for better reliability
   - Consider using Jitsi or Daily.co for enterprise needs

## Production Checklist

Before going live:

- [ ] Change default admin code
- [ ] Generate secure JWT secret
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test video calls with 2+ users
- [ ] Test whiteboard drawing
- [ ] Test chat functionality
- [ ] Test admin controls (if applicable)
- [ ] Set up custom domain (optional)
- [ ] Configure email for password resets (future feature)
- [ ] Monitor error logs for issues
- [ ] Set up database backups

## Support & Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **Socket.IO Docs**: [socket.io/docs](https://socket.io/docs)
- **WebRTC Guide**: [webrtc.org](https://webrtc.org/)

## License

This project is for educational purposes. Modify and use as needed!

---

🎉 **Congratulations!** Your EduCanvas Live platform is now deployed with:
- ✅ Working video calls in production
- ✅ Database-backed user authentication
- ✅ Persistent user accounts
- ✅ Real-time collaborative whiteboard
- ✅ Live chat and video conferencing

Happy Teaching! 🚀
