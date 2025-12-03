# Windows Command Reference

## One-Time Setup

```powershell
# 1. Start Redis (creates container)
docker-compose -f c:\ChatApp\docker-compose.yml up -d redis

# 2. Install packages
cd c:\ChatApp\backend
npm install

# Done! Everything is configured.
```

---

## Daily Development Workflow

### Start Everything

```powershell
# Terminal 1: Start Redis
docker-compose -f c:\ChatApp\docker-compose.yml up -d redis

# Wait a few seconds...

# Terminal 2: Start Backend
cd c:\ChatApp\backend
npm run dev

# Terminal 3: Start Frontend
cd c:\ChatApp\frontend
npm run dev

# Browser: Open http://localhost:5173
```

### Stop Everything

```powershell
# To stop Redis:
docker-compose -f c:\ChatApp\docker-compose.yml down

# To stop Backend: Press Ctrl+C in terminal
# To stop Frontend: Press Ctrl+C in terminal
```

---

## Docker Commands (Windows PowerShell)

### Check If Docker Is Running
```powershell
docker ps
```
**Should show**: `CONTAINER ID ... chatapp-redis`

### Verify Redis Is Working
```powershell
docker exec chatapp-redis redis-cli ping
```
**Should return**: `PONG`

### View Redis Logs
```powershell
docker logs chatapp-redis
```

### Enter Redis CLI (Interactive)
```powershell
docker exec -it chatapp-redis redis-cli

# Inside redis-cli:
> PING              # Should return PONG
> KEYS *            # List all keys
> SMEMBERS onlineUsers    # View online users
> HGETALL sockets   # View socket mappings
> INFO memory       # View memory usage
> FLUSHALL          # Clear all data
> EXIT              # Exit CLI
```

### Stop Redis
```powershell
docker stop chatapp-redis
```

### Start Redis (if stopped)
```powershell
docker start chatapp-redis
```

### Remove Redis Container (Fresh Start)
```powershell
docker stop chatapp-redis
docker rm chatapp-redis
docker-compose -f c:\ChatApp\docker-compose.yml up -d redis
```

### View Container Status
```powershell
docker ps -a
docker stats chatapp-redis
```

---

## Backend Commands

### Install Dependencies
```powershell
cd c:\ChatApp\backend
npm install
```

### Start Development (Auto-reload with Nodemon)
```powershell
cd c:\ChatApp\backend
npm run dev
```

### Start Production
```powershell
cd c:\ChatApp\backend
npm start
```

### Update Dependencies
```powershell
cd c:\ChatApp\backend
npm update
```

### Check Logs in Real-Time
```powershell
cd c:\ChatApp\backend
npm run dev 2>&1 | Tee-Object -FilePath log.txt
```

---

## Frontend Commands

### Install Dependencies
```powershell
cd c:\ChatApp\frontend
npm install
```

### Start Development
```powershell
cd c:\ChatApp\frontend
npm run dev
```

### Build for Production
```powershell
cd c:\ChatApp\frontend
npm run build
```

### Preview Production Build Locally
```powershell
cd c:\ChatApp\frontend
npm run build
npm install -g serve
serve -s dist -l 3000
```

---

## Troubleshooting Commands

### Check What's Using Port 3000
```powershell
netstat -ano | findstr :3000
```

### Check What's Using Port 6379 (Redis)
```powershell
netstat -ano | findstr :6379
```

### Kill Process Using a Port (Replace PID)
```powershell
# First, find PID with netstat command above
taskkill /PID 12345 /F
```

### Check Node Version
```powershell
node --version
npm --version
```

### Clear npm Cache (If Having Install Issues)
```powershell
npm cache clean --force
```

### Check Backend Connection to Redis
```powershell
$env:NODE_ENV="debug"; npm run dev
```

### Test MongoDB Connection
```powershell
# In backend folder, create test file:
# testMongo.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_DB_URI);
  console.log('MongoDB connected!');
  process.exit(0);
} catch(e) {
  console.log('MongoDB failed:', e);
  process.exit(1);
}

# Run it:
node testMongo.js
```

---

## Full System Check (Copy & Paste)

```powershell
# Check Docker
Write-Host "=== Docker ===" -ForegroundColor Green
docker --version
docker ps | findstr chatapp-redis

# Check Node
Write-Host "=== Node.js ===" -ForegroundColor Green
node --version
npm --version

# Check ports
Write-Host "=== Ports ===" -ForegroundColor Green
Write-Host "Redis (6379):" (netstat -ano | findstr :6379 | Measure-Object).Count "processes"
Write-Host "Backend (3000):" (netstat -ano | findstr :3000 | Measure-Object).Count "processes"

# Check Redis connectivity
Write-Host "=== Redis Connectivity ===" -ForegroundColor Green
docker exec chatapp-redis redis-cli ping

# Check files
Write-Host "=== Files ===" -ForegroundColor Green
Test-Path "c:\ChatApp\backend\utils\redis.js"
Test-Path "c:\ChatApp\backend\package.json"
Test-Path "c:\ChatApp\docker-compose.yml"
```

---

## Environment Variables (PowerShell)

### Temporary (Current Terminal Only)
```powershell
$env:PORT=3000
$env:NODE_ENV=development
$env:REDIS_URL="redis://localhost:6379"

# Verify:
$env:PORT
```

### Set Multiple at Once
```powershell
$env:PORT=3000; $env:NODE_ENV=development; npm run dev
```

### Permanently (Windows System)
```powershell
[Environment]::SetEnvironmentVariable("PORT", "3000", "User")
[Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")

# Restart PowerShell to see changes
```

---

## Multi-Server Testing

### Server 1 (Port 3000)
```powershell
cd c:\ChatApp\backend
$env:PORT=3000
npm run dev
```

### Server 2 (Port 3001)
```powershell
cd c:\ChatApp\backend
$env:PORT=3001
npm run dev
```

### Server 3 (Port 3002)
```powershell
cd c:\ChatApp\backend
$env:PORT=3002
npm run dev
```

### Frontend
```powershell
cd c:\ChatApp\frontend
npm run dev
```

### Browser Testing
- Tab 1: http://localhost:5173 (connect to 3000)
- Tab 2: http://localhost:5173 (connect to 3001)
- Tab 3: http://localhost:5173 (connect to 3002)
- Send messages between tabs → All work via Redis ✓

---

## Build and Deploy Commands

### Build Frontend for Production
```powershell
cd c:\ChatApp\frontend
npm run build
```

### Build Everything
```powershell
cd c:\ChatApp\backend
npm run build
```

### Full Production Build
```powershell
cd c:\ChatApp\backend
npm run build
```

---

## Git Commands (If Using Version Control)

```powershell
# Check what changed
git status

# View changes
git diff backend/package.json

# Stage changes
git add backend/utils/redis.js backend/server.js backend/socket/socket.js

# Commit
git commit -m "Add Redis integration for multi-server scalability"

# Push
git push origin main
```

---

## File Editing Commands

### Open Backend in VS Code
```powershell
code c:\ChatApp\backend
```

### Open Entire Project in VS Code
```powershell
code c:\ChatApp
```

### View .env File
```powershell
cat c:\ChatApp\backend\.env
```

### Edit .env File
```powershell
notepad c:\ChatApp\backend\.env
# or
code c:\ChatApp\backend\.env
```

---

## Process Management Commands

### List All Running Node Processes
```powershell
Get-Process node
```

### Kill All Node Processes
```powershell
Get-Process node | Stop-Process -Force
```

### Kill Specific Process
```powershell
Stop-Process -Name "node" -Force
```

---

## Monitoring Commands (Real-Time)

### Monitor Backend Logs
```powershell
cd c:\ChatApp\backend
npm run dev | Tee-Object -FilePath app.log
```

### Monitor Docker
```powershell
docker stats chatapp-redis
```

### Monitor Node Memory
```powershell
Get-Process node | Select-Object ProcessName, WorkingSet, CPU
```

### Continuous Monitoring
```powershell
while($true) { 
  Clear-Host
  docker ps
  Get-Process node
  Start-Sleep -Seconds 5
}
```

---

## Network Diagnostics

### Check If Port Is Accessible
```powershell
Test-NetConnection -ComputerName localhost -Port 6379
Test-NetConnection -ComputerName localhost -Port 3000
Test-NetConnection -ComputerName localhost -Port 5173
```

### Test Redis Connection
```powershell
$socket = New-Object Net.Sockets.TcpClient
$socket.Connect("localhost", 6379)
if($socket.Connected) { Write-Host "Redis is accessible" }
```

### Check Firewall
```powershell
# List inbound rules
Get-NetFirewallRule -Direction Inbound | findstr "6379"

# Allow port through firewall
New-NetFirewallRule -DisplayName "Allow Redis" -Direction Inbound -LocalPort 6379 -Protocol TCP -Action Allow
```

---

## Quick Reference (Common Tasks)

| Task | Command |
|------|---------|
| Start Redis | `docker-compose -f c:\ChatApp\docker-compose.yml up -d redis` |
| Test Redis | `docker exec chatapp-redis redis-cli ping` |
| Install packages | `cd backend; npm install` |
| Run backend | `npm run dev` |
| Run frontend | `cd frontend; npm run dev` |
| Stop everything | `docker-compose down` + Ctrl+C × 2 |
| View logs | `docker logs chatapp-redis` |
| Enter Redis CLI | `docker exec -it chatapp-redis redis-cli` |
| Kill stuck processes | `Get-Process node \| Stop-Process -Force` |
| Check node version | `node --version` |

---

## Useful PowerShell Aliases

Add to PowerShell profile (`$PROFILE`):

```powershell
# Open PowerShell profile
notepad $PROFILE

# Add these aliases:
Set-Alias -Name redis-start -Value { docker-compose -f c:\ChatApp\docker-compose.yml up -d redis }
Set-Alias -Name redis-stop -Value { docker-compose -f c:\ChatApp\docker-compose.yml down }
Set-Alias -Name redis-test -Value { docker exec chatapp-redis redis-cli ping }
Set-Alias -Name backend -Value { cd c:\ChatApp\backend; npm run dev }
Set-Alias -Name frontend -Value { cd c:\ChatApp\frontend; npm run dev }

# Usage:
# redis-start
# redis-test
# backend
# frontend
```

---

**All commands are Windows PowerShell 5.1 compatible. Copy-paste ready!**
