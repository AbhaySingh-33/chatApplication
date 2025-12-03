# Redis Integration Setup Guide for Chat Application

## Overview
This guide walks you through setting up Redis with your MERN chat application for multi-server scalability using Socket.IO Redis Adapter. **All existing functionality remains unchanged.**

---

## Architecture
```
Frontend (React)
    ↓
Backend Instance 1 (Node.js/Socket.IO) ←→ Redis ←→ Backend Instance 2 (Node.js/Socket.IO)
    ↓                                        ↓                    ↓
MongoDB (Messages, Users, Conversations)    Socket Data         Socket Data
```

**Key Point**: Redis only handles Socket.IO cross-server communication. MongoDB still stores all persistent data.

---

## Prerequisites
- Windows 10/11
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Node.js v16+ installed
- Git (already in use)

---

## Step 1: Install Docker Desktop (Windows)

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Run the installer and follow the wizard
3. Restart your computer when prompted
4. Verify installation:
   ```powershell
   docker --version
   docker run hello-world
   ```

---

## Step 2: Install Backend Dependencies

Navigate to the backend directory and install the new packages:

```powershell
cd c:\ChatApp\backend
npm install
```

**Packages added**:
- `redis` (v4.6.12) - Redis client
- `@socket.io/redis-adapter` (v8.2.1) - Socket.IO Redis adapter

---

## Step 3: Start Redis Container

### Option A: Using Docker Compose (Recommended)

```powershell
# Navigate to project root
cd c:\ChatApp

# Start Redis container
docker-compose up -d redis

# Verify Redis is running
docker ps

# Test Redis connection
docker exec chatapp-redis redis-cli ping
```

**Output should be**: `PONG`

### Option B: Using Docker Run (Manual)

```powershell
docker run -d `
  --name chatapp-redis `
  -p 6379:6379 `
  redis:7-alpine `
  redis-server --appendonly yes

# Test connection
docker exec chatapp-redis redis-cli ping
```

---

## Step 4: Verify Environment Variables

Check `.env` file in backend folder contains:

```dotenv
REDIS_URL=redis://localhost:6379
```

If using Docker Compose with networking, use:
```dotenv
REDIS_URL=redis://redis:6379
```

---

## Step 5: Start Backend Server

```powershell
cd c:\ChatApp\backend

# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

**Expected Output**:
```
✓ Redis initialized successfully
✓ Socket.IO Redis adapter initialized
Server Running on port 3000
```

If Redis is unavailable:
```
⚠ Redis is optional. Continuing without Redis adapter (single-server mode).
```

---

## Step 6: Start Frontend

In a new terminal:

```powershell
cd c:\ChatApp\frontend
npm install  # if not already done
npm run dev
```

Open: http://localhost:5173

---

## Step 7: Test Basic Functionality

✓ **Login and send messages** - MongoDB still handles persistence
✓ **Real-time delivery** - Socket.IO events work across tabs
✓ **Online status** - Shows connected users
✓ **Video calls** - Peer connections function normally

**All existing features work identically.** Redis is transparent to the frontend.

---

## Step 8: Test Multi-Server Scalability (Optional)

To verify Redis enables cross-server communication:

### Terminal 1: Start Backend Instance 1
```powershell
cd c:\ChatApp\backend
$env:PORT=3000
npm run dev
```

### Terminal 2: Start Backend Instance 2
```powershell
cd c:\ChatApp\backend
$env:PORT=3001
npm run dev
```

### Terminal 3: Start Frontend (or open multiple browser tabs)
```powershell
cd c:\ChatApp\frontend
npm run dev
```

### Test Steps
1. **Tab 1**: Login as User A, connect to `http://localhost:5173?server=3000`
2. **Tab 2**: Login as User B, connect to `http://localhost:5173?server=3001`
3. **Send Message**: User A → User B
4. **Expected**: Message delivered instantly across servers via Redis
5. **Verify in Redis**: 
   ```powershell
   docker exec chatapp-redis redis-cli
   > KEYS *
   > SMEMBERS onlineUsers
   ```

---

## Docker Commands Reference

```powershell
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop Redis
docker stop chatapp-redis

# Start Redis (if stopped)
docker start chatapp-redis

# View Redis logs
docker logs chatapp-redis

# Enter Redis CLI
docker exec -it chatapp-redis redis-cli

# Remove Redis container
docker rm chatapp-redis

# Stop all services from compose
docker-compose down
```

---

## Redis CLI Commands (Inside Container)

```powershell
# Connect to Redis CLI
docker exec -it chatapp-redis redis-cli

# Inside redis-cli:
PING                          # Test connection
KEYS *                        # List all keys
SMEMBERS onlineUsers          # View online users set
HGETALL sockets               # View socket-user mappings
INFO                          # Server statistics
FLUSHALL                      # Clear all data (caution!)
EXIT                          # Exit Redis CLI
```

---

## Troubleshooting

### Issue: "Redis connection refused"
**Solution**:
```powershell
# Check if Docker is running
docker ps

# If Docker isn't running, start Docker Desktop and wait 30 seconds
# Restart backend after Docker is ready
```

### Issue: "Port 6379 already in use"
**Solution**:
```powershell
# Find process using port 6379
netstat -ano | findstr :6379

# Kill process (replace PID with actual ID)
taskkill /PID <PID> /F

# Or change port in REDIS_URL and docker-compose.yml
```

### Issue: Backend starts but Redis adapter not initialized
**Solution**: This is OK! The app works fine in single-server mode. Redis is optional for local development.

### Issue: Multiple backend instances not communicating
**Solution**:
```powershell
# Verify Redis is running and accessible
docker exec chatapp-redis redis-cli ping

# Check Redis logs
docker logs chatapp-redis

# Restart Redis
docker restart chatapp-redis
```

### Issue: Changes to socket.js not taking effect
**Solution**:
```powershell
# Kill nodemon process and restart
# Or press Ctrl+C and run: npm run dev
```

---

## Performance Benefits

| Scenario | Without Redis | With Redis |
|----------|---|---|
| Single Server | ✓ Works | ✓ Works (no difference) |
| 2+ Servers | ✗ Silos (users on server 1 can't message users on server 2) | ✓ Connected (seamless cross-server messaging) |
| Horizontal Scaling | ✗ Limited | ✓ Scale infinitely |
| Load Balancing | ✗ Session stickiness required | ✓ Stateless servers |

---

## File Changes Summary

**New Files**:
- `backend/utils/redis.js` - Redis connection management

**Modified Files**:
- `backend/server.js` - Added Redis initialization
- `backend/socket/socket.js` - Added Redis adapter
- `backend/package.json` - Added redis, @socket.io/redis-adapter
- `backend/.env` - Added REDIS_URL
- `docker-compose.yml` - Added Redis service

**Unchanged Files**:
- All frontend code (React, components, hooks)
- All MongoDB models and routes
- All socket events (calls, messages, typing)
- All authentication middleware
- Database schemas

---

## Production Deployment

For production (AWS, Heroku, Azure, etc.):

1. **Use managed Redis service** (AWS ElastiCache, Redis Cloud, etc.)
2. **Update .env** with production Redis URL:
   ```dotenv
   REDIS_URL=redis://your-production-redis.redis.cache.windows.net:6380?password=xxx&ssl=true
   ```
3. **Deploy multiple backend instances** behind load balancer
4. **Scale horizontally** - each instance connects to same Redis

---

## Monitoring (Optional)

### Redis Commander GUI (Windows)
```powershell
npm install -g redis-commander
redis-commander --port 8081
```
Open: http://localhost:8081

### CLI Monitoring
```powershell
docker exec chatapp-redis redis-cli
> MONITOR              # Watch all commands in real-time
> SLOWLOG GET 10       # View slow queries
```

---

## Next Steps (Optional Enhancements)

1. **Redis Caching**: Cache frequently accessed user profiles
2. **Session Storage**: Move user sessions from memory to Redis
3. **Real-time Metrics**: Track message throughput, active users
4. **Redis Cluster**: For high-availability production setup
5. **Backup Strategy**: Persist Redis data with AOF/RDB

---

## Support

For issues:
1. Check logs: `npm run dev` terminal
2. Check Docker: `docker logs chatapp-redis`
3. Check Redis: `docker exec chatapp-redis redis-cli PING`
4. Check ports: `netstat -ano | findstr :6379` and `netstat -ano | findstr :3000`

---

**Setup Complete!** Your chat application now supports multi-server scalability with Redis. All existing functionality remains unchanged.
