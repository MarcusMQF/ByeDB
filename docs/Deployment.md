# ByeDB Deployment Guide

## Architecture
- **Frontend**: Next.js deployed on Vercel
- **Backend**: Python FastAPI deployed on external service (Railway/Render/Heroku)

## Deployment Steps

### 1. Deploy Backend (Choose One Platform)

#### Option A: Railway (Recommended)
1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` folder as the root directory
4. Railway will auto-detect Python and use the Procfile
5. Set environment variables in Railway dashboard:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (if used)
   - Any other backend environment variables

#### Option B: Render
1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Option C: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-byedb-backend`
4. Deploy:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-byedb-backend
   git push heroku main
   ```

### 2. Deploy Frontend (Vercel)

#### Method 1: Vercel CLI
```bash
npm i -g vercel
cd frontend
vercel
```

#### Method 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variables:
   - `GEMINI_PROMPT_ENHANCE_API_KEY`: Your Gemini API key
   - `NEXT_PUBLIC_BACKEND_URL`: Your backend URL from step 1

### 3. Environment Variables Setup

#### Vercel Environment Variables
```
GEMINI_PROMPT_ENHANCE_API_KEY=your_gemini_api_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

#### Backend Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url (if using external DB)
```

## Cost Considerations

### Free Tier Options:
- **Vercel**: Free for personal projects
- **Railway**: $5/month after trial
- **Render**: Free tier with limitations
- **Heroku**: No longer has free tier

### Recommended Setup:
- **Frontend**: Vercel (Free)
- **Backend**: Railway ($5/month) or Render (Free tier)
- **Total Cost**: $0-5/month

## Domain Setup

1. **Custom Domain on Vercel**:
   - Go to Vercel dashboard → Your project → Settings → Domains
   - Add your custom domain

2. **SSL**: Automatically handled by Vercel and Railway/Render

## Monitoring & Logs

- **Vercel**: Built-in analytics and logs
- **Railway**: Real-time logs in dashboard
- **Render**: Logs available in dashboard

## CI/CD

Both Vercel and Railway support automatic deployments from GitHub:
- Push to `main` branch → Automatic deployment
- Preview deployments for pull requests

## Performance Optimization

1. **Frontend**:
   - Enable Vercel's Edge Network
   - Use Vercel's Image Optimization
   - Configure caching headers

2. **Backend**:
   - Use connection pooling for database
   - Implement caching for frequent queries
   - Consider Redis for session storage

## Security

1. **Environment Variables**: Never commit API keys
2. **CORS**: Configure properly in FastAPI
3. **Rate Limiting**: Implement in both frontend and backend
4. **Authentication**: Add if required for production

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check FastAPI CORS middleware
2. **Environment Variables**: Ensure they're set in both platforms
3. **Build Failures**: Check dependency versions
4. **API Timeouts**: Configure appropriate timeout values

### Debug Commands:
```bash
# Check Vercel logs
vercel logs

# Check Railway logs
railway logs

# Test backend locally
cd backend
uvicorn main:app --reload
```
