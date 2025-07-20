# Vercel Deployment Guide

## Prerequisites
1. Vercel account
2. Supabase project with configured database
3. GitHub repository

## Environment Variables

### Required Environment Variables in Vercel Dashboard:

**Backend Variables:**
- `NODE_ENV` = `production`
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `CORS_ORIGIN` = Your Vercel frontend domain (e.g., `https://your-app.vercel.app`)
- `FRONTEND_URL` = Your Vercel frontend domain (e.g., `https://your-app.vercel.app`)

**Frontend Variables:**
- `VITE_API_URL` = Your Vercel API URL (e.g., `https://your-app.vercel.app/api`)
- `VITE_SOCKET_URL` = Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `VITE_APP_NAME` = `SesliAsk.NeT`
- `VITE_APP_VERSION` = `1.0.0`
- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

## Deployment Steps

1. **Connect to Vercel:**
   ```bash
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables:**
   Go to your Vercel dashboard > Project Settings > Environment Variables
   Add all the variables listed above.

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## Project Structure
- `frontend/` - React frontend application
- `backend/` - Express.js backend API
- `api/` - Vercel serverless function entry point
- `vercel.json` - Vercel configuration

## Notes
- Socket.IO works with Vercel serverless functions but may have limitations
- For production, consider using a dedicated WebSocket service
- Make sure all environment variables are properly configured