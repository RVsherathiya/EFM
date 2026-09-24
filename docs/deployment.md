# Production Deployment & Environment Setup

## 1. Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<pwd>@cluster.mongodb.net/efm_production?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-256-bit-access-secret-key-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key-here
CLIENT_URL=https://efm.yourcompany.com
COOKIE_DOMAIN=.yourcompany.com
STORAGE_PROVIDER=local # or 's3'
LOCAL_STORAGE_PATH=/var/efm/uploads
```

### Frontend (`client/.env`)
```env
VITE_API_URL=https://api.efm.yourcompany.com/api/v1
```

## 2. Docker Deployment

A multi-stage `docker-compose.yml` can run MongoDB and application containers:

```bash
docker compose up -d mongodb
```

## 3. Local Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Seed development database
cd ../server
npm run seed

# 3. Start development servers
# In terminal 1:
cd server && npm run dev

# In terminal 2:
cd client && npm run dev
```
