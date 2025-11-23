# Prisma Accelerate Setup Guide

You're using **Prisma Accelerate** which provides connection pooling and global caching for your database! This is perfect for production deployments.

## ⚠️ IMPORTANT: Get Your Direct Database URL

Your `.env` file currently has your Accelerate connection string, but you need to add the **direct database URL** for migrations to work.

### Steps to Get Direct URL:

1. **Go to Prisma Accelerate Dashboard**:
   - Visit: https://console.prisma.io/
   - Log in to your account
   - Select your project

2. **Find Connection Details**:
   - Click on your database/project
   - Look for "Connection Details" or "Connection Strings"
   - Copy the **Direct Connection URL** (not the Accelerate URL)
   - It should look like: `postgresql://username:password@hostname:5432/database`

3. **Update Your `.env` File**:
   ```bash
   cd /home/yash/projects/educanvas-live/backend
   nano .env  # or use your preferred editor
   ```
   
   Replace this line:
   ```
   DIRECT_DATABASE_URL="postgresql://REPLACE_WITH_DIRECT_URL_FROM_ACCELERATE_DASHBOARD"
   ```
   
   With your actual direct URL:
   ```
   DIRECT_DATABASE_URL="postgresql://username:password@hostname:5432/database"
   ```

## Running Migrations

Once you've set the `DIRECT_DATABASE_URL`, run migrations:

```bash
cd /home/yash/projects/educanvas-live/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## Configuration Files

Your setup uses two connection strings:

1. **`DATABASE_URL`** (Accelerate URL):
   - Used for queries at runtime
   - Provides connection pooling and caching
   - Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_KEY`
   - ✅ Already configured in your `.env`

2. **`DIRECT_DATABASE_URL`** (Direct PostgreSQL URL):
   - Used only for migrations
   - Direct connection to your database
   - Format: `postgresql://user:password@host:port/database`
   - ⚠️ **YOU NEED TO ADD THIS**

## Benefits of Prisma Accelerate

✅ **Connection Pooling**: Handles many connections efficiently
✅ **Global Caching**: Reduces database load
✅ **Better Performance**: Especially for serverless deployments
✅ **Edge-Ready**: Works great with edge functions

## Testing Your Setup

### 1. Test Prisma Client Generation
```bash
cd /home/yash/projects/educanvas-live/backend
npx prisma generate
```

Expected output: ✔ Generated Prisma Client

### 2. Test Migration
```bash
npx prisma migrate deploy
```

Expected output: 
- Lists applied migrations
- Shows ✔ for each migration

### 3. View Database (Optional)
```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 to view your data.

### 4. Start Development Server
```bash
npm run dev
```

Your server should start without database connection errors.

## Production Deployment (Render)

When deploying to Render with Prisma Accelerate:

### Update `render.yaml`:

```yaml
services:
  - type: web
    name: educanvas-backend
    runtime: node
    plan: starter
    region: oregon
    rootDir: backend
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: "prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
      - key: DIRECT_DATABASE_URL
        value: "postgresql://your-direct-connection-string"
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_CODE
        value: teach123
    healthCheckPath: /health
```

**Note**: You don't need a separate PostgreSQL database service on Render since you're using Prisma Accelerate!

## Troubleshooting

### Error: "Direct URL is required for migrations"
**Solution**: Add `DIRECT_DATABASE_URL` to your `.env` file

### Error: "Invalid API key"
**Solution**: Make sure your Accelerate API key in `DATABASE_URL` is correct

### Error: "Cannot connect to database"
**Solutions**:
1. Verify `DIRECT_DATABASE_URL` is correct
2. Check if your database is accessible
3. Ensure your IP is whitelisted (if using managed database)

### Error: "Prisma Client not generated"
**Solution**: Run `npx prisma generate` after any schema changes

## Migration Commands Cheat Sheet

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration (development)
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# View database in browser
npx prisma studio

# Check migration status
npx prisma migrate status
```

## Next Steps

1. ✅ Add `DIRECT_DATABASE_URL` to your `.env` file
2. ✅ Run `npx prisma generate`
3. ✅ Run `npx prisma migrate deploy`
4. ✅ Test your app: `npm run dev`
5. ✅ Check database: `npx prisma studio`

## Need Help?

- **Prisma Accelerate Docs**: https://www.prisma.io/docs/accelerate
- **Prisma Migrate Docs**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Prisma Console**: https://console.prisma.io/

---

Once you've added the `DIRECT_DATABASE_URL`, you'll be ready to run migrations and start developing! 🚀
