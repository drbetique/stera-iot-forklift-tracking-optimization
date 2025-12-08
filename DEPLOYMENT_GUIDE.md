# Stera IoT Forklift Tracking - Deployment Guide

Complete guide to deploy your application to production and make it accessible online.

---

## Prerequisites

- GitHub account (✅ You already have this)
- Vercel account (free): https://vercel.com
- Render account (free): https://render.com
- MongoDB Atlas (✅ You already have this)
- InfluxDB Cloud (✅ You already have this)

---

## Architecture Overview

```
┌─────────────┐      HTTPS      ┌──────────────┐
│   Frontend  │ ◄─────────────► │   Backend    │
│   (Vercel)  │                 │   (Render)   │
└─────────────┘                 └──────────────┘
                                       │
                                       │
                        ┌──────────────┴──────────────┐
                        │                             │
                 ┌──────▼──────┐              ┌──────▼──────┐
                 │   MongoDB   │              │  InfluxDB   │
                 │    Atlas    │              │    Cloud    │
                 └─────────────┘              └─────────────┘
```

---

## Step 1: Prepare Backend for Deployment

### 1.1 Create Production Environment File

Create `backend/.env.production` (don't commit this):

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# MongoDB Atlas (use your existing connection string)
MONGODB_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/forklift-tracking?retryWrites=true&w=majority

# CORS (will be updated after frontend deployment)
CORS_ORIGIN=https://your-app-name.vercel.app

# InfluxDB Cloud
INFLUXDB_URL=https://us-east-1-1.aws.cloud2.influxdata.com
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=your-org-id
INFLUXDB_BUCKET=forklift_sensors

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 1.2 Update package.json Start Script

Your `backend/package.json` should have:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 1.3 Add Health Check Endpoint

Already exists at `/health` - Render will use this to check if your app is running.

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `drbetique/stera-iot-forklift-tracking-optimization`
4. Configure the service:

```yaml
Name: stera-iot-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 2.2 Set Environment Variables

In Render dashboard, add these environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  (your MongoDB Atlas connection string)
CORS_ORIGIN=*  (temporarily - will update after frontend deployment)
INFLUXDB_URL=https://us-east-1-1.aws.cloud2.influxdata.com
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=forklift_sensors
JWT_SECRET=your-secure-random-secret
PORT=3001
```

### 2.3 Deploy

Click **"Create Web Service"** - Render will:
- Install dependencies
- Start your server
- Provide a URL like: `https://stera-iot-backend.onrender.com`

⚠️ **Note:** Free tier spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds.

---

## Step 3: Prepare Frontend for Deployment

### 3.1 Update API Configuration

Update `frontend/src/services/api.js`:

```javascript
// Replace localhost with your Render backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://stera-iot-backend.onrender.com/api'  // Your Render URL
    : 'http://localhost:3001/api');
```

### 3.2 Create Environment File

Create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://stera-iot-backend.onrender.com/api
```

### 3.3 Test Production Build Locally

```bash
cd frontend
npm run build
npx serve -s build
```

Visit http://localhost:3000 to test the production build.

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 4.2 Deploy via Vercel Dashboard (Easier)

1. Go to https://vercel.com and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

```yaml
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### 4.3 Set Environment Variables

In Vercel project settings, add:

```
REACT_APP_API_URL=https://stera-iot-backend.onrender.com/api
```

### 4.4 Deploy

Click **"Deploy"** - Vercel will:
- Install dependencies
- Build your React app
- Deploy to CDN
- Provide URL like: `https://stera-iot.vercel.app`

---

## Step 5: Update CORS Configuration

### 5.1 Update Backend CORS

In Render dashboard, update `CORS_ORIGIN` environment variable:

```
CORS_ORIGIN=https://stera-iot.vercel.app
```

Or to allow multiple origins:

```
CORS_ORIGIN=https://stera-iot.vercel.app,https://your-custom-domain.com
```

### 5.2 Redeploy Backend

Render will automatically redeploy when you change environment variables.

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Frontend Domain (Vercel)

1. Go to Vercel project settings → Domains
2. Add your custom domain (e.g., `app.steratech.com`)
3. Follow Vercel's DNS configuration instructions
4. Vercel provides free SSL certificate

### 6.2 Backend Domain (Render)

1. Go to Render service settings → Custom Domain
2. Add your domain (e.g., `api.steratech.com`)
3. Update DNS records as instructed
4. Render provides free SSL certificate

---

## Step 7: Test Production Deployment

### 7.1 Functional Testing

1. Visit your Vercel URL: `https://stera-iot.vercel.app`
2. Test login functionality
3. Verify forklift data loads
4. Check map displays correctly
5. Test "View Details" modal with map
6. Verify analytics dashboard loads

### 7.2 API Testing

```bash
# Test backend health
curl https://stera-iot-backend.onrender.com/health

# Test API endpoint
curl https://stera-iot-backend.onrender.com/api/forklifts
```

---

## Alternative Deployment Options

### Option 2: All-in-One Platform

**Railway.app** (Free tier with $5 credit)
- Deploy both frontend and backend
- Automatic SSL certificates
- Easy environment variable management
- GitHub integration

### Option 3: Traditional VPS

**DigitalOcean Droplet** ($4-6/month)
- Full control over server
- Install Node.js, Nginx, PM2
- Manual SSL with Let's Encrypt
- More complex but more powerful

### Option 4: Containerized Deployment

**Docker + Fly.io/Railway**
- Create Dockerfile for backend
- Deploy containers
- Good for scaling

---

## Production Checklist

Before going live, ensure:

- [ ] MongoDB Atlas has proper indexes
- [ ] Environment variables are secure (no hardcoded secrets)
- [ ] CORS is configured properly
- [ ] SSL certificates are active (HTTPS)
- [ ] Error logging is set up (consider Sentry.io)
- [ ] Rate limiting is configured
- [ ] Database backups are enabled
- [ ] Analytics tracking is set up (Google Analytics optional)
- [ ] User authentication is secure
- [ ] Mobile responsiveness tested
- [ ] Performance testing done

---

## Monitoring & Maintenance

### Backend Monitoring (Render)

- Check logs in Render dashboard
- Set up alerts for errors
- Monitor response times

### Frontend Monitoring (Vercel)

- Check Analytics in Vercel dashboard
- Monitor Core Web Vitals
- Track deployment status

### Database Monitoring

- MongoDB Atlas dashboard for performance
- InfluxDB Cloud dashboard for sensor data

---

## Cost Breakdown

### Free Tier (Recommended for MVP)

| Service | Plan | Cost | Limitations |
|---------|------|------|-------------|
| Vercel | Hobby | FREE | 100 GB bandwidth, 100 deployments/day |
| Render | Free | FREE | 750 hours/month, spins down after 15 min |
| MongoDB Atlas | Free | FREE | 512 MB storage |
| InfluxDB Cloud | Free | FREE | 30-day retention |
| **Total** | | **$0/month** | Good for development/testing |

### Paid Tier (Production Ready)

| Service | Plan | Cost | Benefits |
|---------|------|------|----------|
| Vercel | Pro | $20/month | Better performance, analytics |
| Render | Starter | $7/month | Always on, no spin down |
| MongoDB Atlas | M10 | $57/month | 10 GB storage, backups |
| InfluxDB Cloud | Usage | ~$30/month | Longer retention, more writes |
| **Total** | | **~$114/month** | Production grade |

---

## Scaling Considerations

### When to Upgrade

Upgrade from free tier when:
- Backend spin-down delays are unacceptable
- You exceed free tier limits
- You need better performance
- You require 99.9% uptime SLA

### Horizontal Scaling

For high traffic:
- Use load balancer (Render Pro, AWS ELB)
- Deploy multiple backend instances
- Use Redis for session management
- Implement CDN for static assets

---

## Security Best Practices

1. **Never commit `.env` files** ✅ Already in .gitignore
2. **Use HTTPS everywhere** ✅ Provided by Vercel/Render
3. **Rotate secrets regularly** (JWT_SECRET, API tokens)
4. **Implement rate limiting** (consider express-rate-limit)
5. **Enable MongoDB IP whitelist** (allow Render IPs)
6. **Use CSP headers** (Content Security Policy)
7. **Keep dependencies updated** (npm audit fix)

---

## Troubleshooting

### Frontend Issues

**Problem:** API calls failing with CORS error
**Solution:** Check `CORS_ORIGIN` in Render matches your Vercel URL

**Problem:** Environment variables not loading
**Solution:** Rebuild frontend in Vercel after adding env vars

### Backend Issues

**Problem:** Backend not starting on Render
**Solution:** Check logs, verify `npm start` script works

**Problem:** Database connection failing
**Solution:** Verify MongoDB connection string, check IP whitelist

---

## Next Steps

After deployment:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Document API for team members
4. Consider adding CI/CD pipeline
5. Plan for data backup strategy
6. Set up staging environment

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **InfluxDB Cloud:** https://docs.influxdata.com/influxdb/cloud

---

**🎉 Congratulations!** Your Stera IoT application is now production-ready and accessible worldwide!

For questions or issues, refer to the documentation or check logs in respective dashboards.
