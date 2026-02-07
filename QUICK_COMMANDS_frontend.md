# ⚡ QUICK START COMMANDS
## Proxi Full Stack Integration

Copy and paste these commands to get everything running!

---

## 🎯 ONE-LINE QUICK START

```bash
# Terminal 1 (Backend)
cd proxi-armoriq && source venv/bin/activate && python -m uvicorn src.mcp_server.server:app --reload --port 8000

# Terminal 2 (Frontend)
cd proxi-frontend && npm install && npm run dev
```

Then open: **http://localhost:3000**

---

## 📦 FIRST TIME SETUP

### Backend Setup
```bash
# 1. Navigate to backend
cd proxi-armoriq

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start server
python -m uvicorn src.mcp_server.server:app --reload --port 8000
```

### Frontend Setup
```bash
# 1. Navigate to frontend
cd proxi-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 🚀 DAILY DEVELOPMENT

### Start Everything (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd proxi-armoriq
source venv/bin/activate
python -m uvicorn src.mcp_server.server:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd proxi-frontend
npm run dev
```

**Browser:**
```
http://localhost:3000
```

---

## 🧪 TESTING COMMANDS

### Test Backend Only
```bash
# Run backend tests
cd proxi-armoriq
python test_installation.py

# Manual API test
curl http://localhost:8000
curl http://localhost:8000/policy/status
curl http://localhost:8000/tools/catalog
```

### Test Frontend Only
```bash
# Build frontend
cd proxi-frontend
npm run build

# Preview production build
npm run preview
```

### Test Integration
```bash
# Backend must be running first!
# Then in frontend directory:
npm run dev

# Open http://localhost:3000
# Click around - everything should work!
```

---

## 🔧 TROUBLESHOOTING COMMANDS

### Backend Not Working
```bash
# Check if port 8000 is in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process on port 8000
kill -9 <PID>  # Mac/Linux

# Restart backend
cd proxi-armoriq
source venv/bin/activate
python -m uvicorn src.mcp_server.server:app --reload --port 8000
```

### Frontend Not Working
```bash
# Clear npm cache
cd proxi-frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### CORS Issues
```bash
# Make sure you're accessing via Vite dev server
# Correct: http://localhost:3000
# Wrong: file:///path/to/index.html
```

---

## 📊 USEFUL MONITORING COMMANDS

### Watch Backend Logs
```bash
# Backend logs in terminal where uvicorn is running
# Look for:
# - POST /tools/execute
# - POST /policy/set-mode
# - GET /policy/status
```

### Watch Frontend Network
```bash
# Open browser DevTools (F12)
# Network tab
# Filter: XHR or Fetch
# Watch API calls to /api/*
```

### Check Process Status
```bash
# Check backend
curl http://localhost:8000

# Check frontend
curl http://localhost:3000
```

---

## 🎬 DEMO COMMANDS

### Run Full Demo Script
```bash
# Terminal 1
cd proxi-armoriq
python main.py  # Runs automated demo scenarios

# Terminal 2
cd proxi-frontend
npm run dev  # Interactive dashboard
```

### Quick Policy Test
```bash
# In browser console (F12):
fetch('/api/policy/status')
  .then(r => r.json())
  .then(console.log)

fetch('/api/policy/set-mode', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({mode: 'EMERGENCY'})
})
  .then(r => r.json())
  .then(console.log)
```

---

## 🏗️ BUILD COMMANDS

### Production Build
```bash
# Frontend production build
cd proxi-frontend
npm run build
# Output: dist/

# Preview production build
npm run preview
```

### Clean Everything
```bash
# Backend
cd proxi-armoriq
rm -rf venv __pycache__ src/**/__pycache__

# Frontend
cd proxi-frontend
rm -rf node_modules dist .vite
```

---

## 📦 PACKAGE MANAGEMENT

### Update Dependencies

**Backend:**
```bash
cd proxi-armoriq
pip list --outdated
pip install --upgrade <package-name>
```

**Frontend:**
```bash
cd proxi-frontend
npm outdated
npm update <package-name>
```

### Add New Dependencies

**Backend:**
```bash
pip install <package-name>
pip freeze > requirements.txt
```

**Frontend:**
```bash
npm install <package-name>
# Automatically updates package.json
```

---

## 🌐 PORT CONFIGURATION

### Default Ports
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Proxy**: http://localhost:3000/api → http://localhost:8000

### Change Backend Port
```bash
# In startup command:
python -m uvicorn src.mcp_server.server:app --reload --port 9000

# Update frontend vite.config.js:
# proxy: { '/api': { target: 'http://localhost:9000' } }
```

### Change Frontend Port
```bash
# In vite.config.js:
# server: { port: 4000 }

# Or via command:
npm run dev -- --port 4000
```

---

## 🔐 ENVIRONMENT VARIABLES

### Backend (.env)
```bash
# Optional - for real LLMs
echo "OPENAI_API_KEY=your-key-here" > .env
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
```

### Frontend
```bash
# For production API URL
echo "VITE_API_URL=https://api.yourproduction.com" > .env.production
```

---

## 🎯 COMPLETE RESET

Start fresh from scratch:

```bash
# Backend
cd proxi-armoriq
rm -rf venv __pycache__ src/**/__pycache__
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd proxi-frontend
rm -rf node_modules package-lock.json dist .vite
npm install

# Start both
# Terminal 1: Backend
python -m uvicorn src.mcp_server.server:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

---

## ✅ VERIFICATION CHECKLIST

After starting everything, verify:

```bash
# ✅ Backend health
curl http://localhost:8000
# Should return: {"service": "Proxi MCP Server", "status": "operational"}

# ✅ Frontend loading
curl http://localhost:3000
# Should return: HTML content

# ✅ API proxy working
curl http://localhost:3000/api/policy/status
# Should return: Policy status JSON

# ✅ Browser console (F12)
# Should show: No errors

# ✅ Network tab
# Should show: Successful /api/* requests
```

---

## 🎓 LEARNING COMMANDS

### Explore Backend API
```bash
# Interactive API docs
open http://localhost:8000/docs

# Or manually:
curl http://localhost:8000/policy/status
curl http://localhost:8000/tools/catalog
curl http://localhost:8000/infrastructure/status
```

### Explore Frontend Structure
```bash
# List all components
find src/components -name "*.jsx"

# View component
cat src/components/PolicyStatusCard.jsx

# Count lines of code
find src -name "*.jsx" -o -name "*.js" | xargs wc -l
```

---

## 🎬 HACKATHON DEMO SCRIPT

### 5-Minute Demo Commands

```bash
# Setup (before demo)
# Terminal 1: cd proxi-armoriq && python -m uvicorn src.mcp_server.server:app --reload --port 8000
# Terminal 2: cd proxi-frontend && npm run dev
# Browser: http://localhost:3000

# During Demo:
# 1. Show dashboard - "This is our context-aware security system"
# 2. Point to NORMAL mode badge
# 3. Try restart tool → BLOCKED → "Policy enforcement in action"
# 4. Switch to EMERGENCY mode → "Context-aware permissions"
# 5. Try restart again → SUCCESS → "Now allowed"
# 6. Try delete database → BLOCKED → "Defense in depth - always safe"
# 7. Show agent chat → "AI agent respects policies"
```

---

**Copy these commands and you're ready to go!** 🚀

No more searching through documentation - everything you need is right here! 📋
