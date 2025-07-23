# Environment Variables Configuration

This document explains how to configure environment variables for both development and production deployment.

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

### Required Variables

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Gemini API Key for prompt enhancement
GEMINI_PROMPT_ENHANCE_API_KEY=your_gemini_api_key_here
```

### Optional Variables

```bash
# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Deployment Configuration

### For Production Deployment

1. **Update the backend URL** in your production environment:

```bash
# Replace localhost with your actual backend URL
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

### For Vercel Deployment

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Add environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`: Your production backend URL
   - `GEMINI_PROMPT_ENHANCE_API_KEY`: Your Gemini API key

### For Other Platforms (Netlify, AWS, etc.)

Follow the same pattern - set the environment variables in your deployment platform's configuration.

## Backend Environment Variables

The backend also requires certain environment variables. Check the backend `.env` file for:

```bash
# Database configuration
DATABASE_URL=your_database_url

# API Keys
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Other backend-specific variables
```

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to version control
- Use `NEXT_PUBLIC_` prefix only for variables that need to be exposed to the browser
- Keep sensitive keys (like API keys) secure and use environment variable management tools

## Troubleshooting

### Common Issues

1. **"Backend not reachable" errors**: Check that `NEXT_PUBLIC_API_BASE_URL` points to the correct backend URL
2. **API calls failing**: Ensure the backend is running and accessible from the frontend
3. **Environment variables not loading**: Make sure the file is named `.env.local` (not `.env.example`)

### Testing Your Configuration

You can test if your environment variables are properly loaded by:

1. Check the browser's Network tab for API calls
2. Verify the requests are going to the correct backend URL
3. Use the browser console to check `process.env.NEXT_PUBLIC_API_BASE_URL` 