# Deploy EduCanvas Live to Render

This guide walks you through deploying your EduCanvas Live application to Render.

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Git Repository**: Push your code to GitHub first

## Deployment Options

### Option A: Blueprint Deployment (Recommended)

This automatically creates both frontend and backend services.

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy via Blueprint**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repo containing `render.yaml`
   - Click **"Apply"**

3. **Services Created**:
   - `educanvas-backend`: Backend API server
   - `educanvas-frontend`: React static site

### Option B: Manual Deployment

#### Step 1: Deploy Backend

1. **New Web Service**:
   - Dashboard → **"New"** → **"Web Service"**
   - Connect GitHub → Select repository
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   USE_HTTPS=false
   ADMIN_CODE=your-secure-admin-code
   ```

3. **Auto-Deploy**: Enable ✅

#### Step 2: Deploy Frontend

1. **New Static Site**:
   - Dashboard → **"New"** → **"Static Site"**
   - Connect GitHub → Same repository
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   REACT_APP_BACKEND_URL=https://your-backend-service-url.onrender.com
   GENERATE_SOURCEMAP=false
   ```

## Configuration

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `ADMIN_CODE` | Admin access code | `teach123` |
| `USE_HTTPS` | Force HTTPS (dev only) | `false` |
| `FRONTEND_URL` | Frontend domain | Auto-set by Blueprint |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API URL | Auto-set by Blueprint |
| `NODE_ENV` | Build environment | `production` |
| `GENERATE_SOURCEMAP` | Include source maps | `false` |

## Post-Deployment

### 1. Update CORS Settings

If using manual deployment, update your backend's environment variables:
- `FRONTEND_URL`: Your frontend's Render URL
- `RENDER_EXTERNAL_URL`: Your backend's Render URL

### 2. Test the Application

1. Open your frontend URL
2. Join as a student with any name
3. Join as admin using your admin code
4. Test features:
   - ✅ Chat messaging
   - ✅ Whiteboard drawing
   - ✅ Video conferencing
   - ✅ Screen sharing

### 3. Custom Domain (Optional)

1. **Backend Custom Domain**:
   - Service Settings → Custom Domains
   - Add your API subdomain (e.g., `api.yourdomain.com`)

2. **Frontend Custom Domain**:
   - Service Settings → Custom Domains
   - Add your main domain (e.g., `yourdomain.com`)

3. **Update Environment Variables**:
   - Update `REACT_APP_BACKEND_URL` in frontend
   - Update `FRONTEND_URL` in backend

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**:
   - Check backend logs for startup errors
   - Verify `package.json` scripts are correct
   - Ensure `PORT` environment variable is used

2. **CORS Errors**:
   - Verify `FRONTEND_URL` matches your frontend domain
   - Check CORS configuration in `server.js`

3. **WebSocket Connection Failed**:
   - Ensure backend service is running
   - Check `REACT_APP_BACKEND_URL` is correct
   - Verify Socket.IO can connect over HTTPS

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies in `package.json`
   - Review build logs for specific errors

### Logs and Debugging

- **Backend Logs**: Service → Logs tab
- **Frontend Build Logs**: Service → Events tab
- **Live Logs**: Use Render's log streaming

### Performance Tips

1. **Free Tier Limitations**:
   - Services sleep after 15 minutes of inactivity
   - First request may take 30-60 seconds (cold start)

2. **Optimization**:
   - Keep services active with uptime monitoring
   - Consider upgrading to paid plans for production use

## Local Development

After deployment, you can still develop locally:

```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Backend only
npm run server

# Frontend only  
npm run client
```

## Environment Files

Create local environment files from examples:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend  
cp frontend/.env.example frontend/.env
```

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Socket.IO Guide**: [socket.io/docs](https://socket.io/docs)
- **React Deployment**: [create-react-app.dev/docs/deployment](https://create-react-app.dev/docs/deployment)

---

🎉 **Your EduCanvas Live app is now deployed on Render!**

Share your frontend URL with students and the admin code with teachers.
