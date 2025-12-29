# Render Deployment Guide

## Quick Setup

### Option 1: Using Render Dashboard (Recommended)

1. **Connect Repository**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as root

2. **Configure Build Settings**:
   ```
   Name: waste-management-api
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**:
   Click "Advanced" → Add environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=24h
   PORT=5000
   GPS_VALIDATION_RADIUS=50
   OPERATIONAL_HOURS_START=06:00
   OPERATIONAL_HOURS_END=18:00
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy

---

### Option 2: Using render.yaml (Infrastructure as Code)

The `render.yaml` file is already configured. Just:

1. Push `render.yaml` to your repository
2. In Render dashboard, create a new "Blueprint"
3. Connect your repository
4. Render will read `render.yaml` and set up everything

**Important**: You still need to manually set `MONGODB_URI` in the dashboard (for security).

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret for JWT signing | `your-random-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `PORT` | Server port | `5000` |
| `GPS_VALIDATION_RADIUS` | GPS proximity in meters | `50` |
| `OPERATIONAL_HOURS_START` | Collection start time | `06:00` |
| `OPERATIONAL_HOURS_END` | Collection end time | `18:00` |

---

## MongoDB Setup (MongoDB Atlas)

1. Go to https://cloud.mongodb.com
2. Create a free cluster (if you haven't)
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
6. Add to Render as `MONGODB_URI`

---

## After Deployment

### 1. Test Health Check
```bash
curl https://your-app.onrender.com/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Waste Management API is running",
  "timestamp": "2024-12-29T..."
}
```

### 2. Seed the Database (First time only)

**Option A**: Run locally pointing to production DB
```bash
# Update .env with production MONGODB_URI
npm run seed
```

**Option B**: Use Render Shell
1. Go to Render Dashboard → Your Service → Shell
2. Run:
   ```bash
   node src/scripts/seedDatabase.js
   ```

### 3. Test Login
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gpbn-gp1@admin.com",
    "password": "admin123",
    "role": "GP_ADMIN"
  }'
```

---

## Deployment Checklist

- [ ] Repository connected to Render
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Root directory: `backend` (if monorepo)
- [ ] Environment variables set (especially `MONGODB_URI`)
- [ ] MongoDB Atlas whitelist: `0.0.0.0/0`
- [ ] Health check working: `/api/health`
- [ ] Database seeded with initial data
- [ ] Test login with seeded users
- [ ] Update frontend API base URL to Render URL

---

## Common Issues & Solutions

### Issue: "npm" command fails

**Solution**: Build command should be `npm install`, not just `npm`

### Issue: Module not found errors

**Solution**: Make sure `"type": "module"` is in package.json

### Issue: Cannot connect to MongoDB

**Solution**: 
- Check MongoDB Atlas IP whitelist (use `0.0.0.0/0`)
- Verify connection string format
- Make sure database user has read/write permissions

### Issue: Health check fails

**Solution**: 
- Verify app is running on port from `process.env.PORT`
- Check `/api/health` endpoint exists
- Look at Render logs for errors

### Issue: CORS errors from frontend

**Solution**: Update `src/server.js` CORS config:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true,
}));
```

---

## Monitoring

- **Logs**: Render Dashboard → Your Service → Logs
- **Metrics**: Render Dashboard → Your Service → Metrics
- **Health**: Monitor `/api/health` endpoint

---

## Free Tier Limitations (Render)

- **Spin down after 15 min inactivity**
- **Cold starts** take 30-50 seconds
- **750 hours/month** free

To keep app alive, use a service like **UptimeRobot** to ping your health endpoint every 5 minutes.

---

## Production Recommendations

1. **Use better JWT secret**: Generate random 64-char string
2. **Enable HTTPS only**: Render does this automatically
3. **Set up monitoring**: Use Render metrics + external monitoring
4. **Database backups**: Enable in MongoDB Atlas
5. **Rate limiting**: Add express-rate-limit middleware
6. **Logging**: Add winston or pino for structured logs

---

## Updating the Deployment

Just push to GitHub:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will automatically detect the change and redeploy!

---

## Support

- Render Docs: https://render.com/docs
- Render Support: https://render.com/support
- MongoDB Atlas: https://cloud.mongodb.com

---

**Your app will be live at**: `https://waste-management-api.onrender.com`

Replace with your actual Render URL after deployment! 🚀
