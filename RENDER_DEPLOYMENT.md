# Render Deployment Guide

## Environment Variables for Render

Set the following environment variables in your Render dashboard:

### Required Variables

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

### Optional Variables (Redis - for caching)

```
REDIS_REQUIRED=false
REDIS_URL=
```

### Other Configuration

```
PRICE_CACHE_TTL=300
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
ORACLE_DEFAULT_INTERVAL_HOURS=24
ORACLE_MAX_DATA_POINTS=1000
```

## Deployment Steps

1. **Create a Render Account**: Go to https://render.com and sign up

2. **Connect your GitHub repository**: Link your repository to Render

3. **Create a Web Service**:

   - Choose "Web Service"
   - Connect your repository
   - Set the following:
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Environment**: Node

4. **Set Environment Variables**:

   - Go to the Environment section in your service settings
   - Add all the required environment variables listed above

5. **Deploy**: Click "Create Web Service"

## Important Notes

- **Redis is Optional**: The application will run without Redis. If you don't set `REDIS_URL`, it will skip Redis initialization and run without caching
- **MongoDB is Required**: You must provide a valid `MONGODB_URI`
- **Alchemy API**: You must provide a valid `ALCHEMY_API_KEY`

## Performance Considerations

- Without Redis caching, API responses may be slower as data will be fetched from the database each time
- Consider adding Redis if you need better performance (Render offers Redis add-ons)

## Health Check

Your application includes a health check endpoint at `/health` that Render can use to monitor your service.

## Sample .env for Local Development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values.
