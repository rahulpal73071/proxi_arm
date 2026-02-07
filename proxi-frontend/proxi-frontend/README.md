# Proxi Frontend - React Dashboard

Beautiful, interactive frontend for the Proxi Context-Aware Cloud Guardian system.

## 🎨 Features

- **Real-time Policy Monitoring** - See current mode and allowed/blocked tools
- **Infrastructure Dashboard** - Monitor service health and fleet status
- **Interactive Tool Executor** - Test policy enforcement manually
- **AI Agent Chat** - Communicate with the Proxi SRE agent
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Beautiful UI** - Modern design with Tailwind CSS

## 📦 Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon set
- **Axios** - HTTP client
- **React Router** - Client-side routing

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Proxi backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:3000**

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

The frontend is configured to connect to the backend via Vite's proxy:

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

To change the backend URL, edit `vite.config.js`.

## 📁 Project Structure

```
proxi-frontend/
├── src/
│   ├── components/           # React components
│   │   ├── PolicyStatusCard.jsx
│   │   ├── InfrastructureMonitor.jsx
│   │   ├── ToolExecutor.jsx
│   │   └── AgentChat.jsx
│   ├── contexts/             # React context providers
│   │   └── ProxiContext.jsx
│   ├── pages/                # Page components
│   │   └── Dashboard.jsx
│   ├── services/             # API services
│   │   └── api.js
│   ├── types/                # Type definitions
│   │   └── index.js
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── index.html                # HTML template
├── package.json              # Dependencies
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
└── postcss.config.js         # PostCSS configuration
```

## 🎯 Components Overview

### PolicyStatusCard
Displays current operational mode (NORMAL/EMERGENCY) and shows allowed/blocked tools with color-coded indicators.

**Features:**
- Mode toggle button
- Real-time policy updates
- Allowed/blocked tool lists
- Mode descriptions

### InfrastructureMonitor
Real-time monitoring of cloud services and fleet status.

**Features:**
- Service health indicators
- Fleet size visualization
- Simulate incident button
- Recent actions log

### ToolExecutor
Interactive panel for manually testing tools and policy enforcement.

**Features:**
- Tool selection dropdown
- Dynamic parameter inputs
- Policy validation preview
- Execution results with detailed feedback

### AgentChat
Chat interface for communicating with the AI agent.

**Features:**
- Message history
- Quick action buttons
- Real-time thinking indicator
- Tool usage and policy block notifications

## 🔌 API Integration

The frontend communicates with the backend through these endpoints:

### Policy API
- `GET /policy/status` - Get current policy configuration
- `POST /policy/set-mode` - Change operational mode

### Tools API
- `POST /tools/execute` - Execute a tool
- `GET /tools/catalog` - Get available tools

### Infrastructure API
- `GET /infrastructure/status` - Get service health
- `POST /infrastructure/simulate-incident` - Simulate failures

All API calls are handled by the `api.js` service with automatic error handling and logging.

## 🎨 Styling

The project uses **Tailwind CSS** for styling with a custom color palette:

- **Primary**: Indigo/Purple gradient
- **Success**: Green tones
- **Danger**: Red tones
- **Warning**: Orange/Yellow tones

Custom components are styled with Tailwind utility classes for consistency and maintainability.

## 🧪 Development

### Hot Reload
Vite provides instant hot module replacement (HMR) during development.

### Console Logging
API requests and responses are logged to the browser console for debugging.

### Error Handling
All API errors are caught and displayed in the UI with user-friendly messages.

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:
- **Mobile**: Single column layout
- **Tablet**: Optimized grid layout
- **Desktop**: Full two-column dashboard

## 🎯 Usage Examples

### Monitor System State
1. View Policy Status card to see current mode
2. Check Infrastructure Monitor for service health
3. Observe allowed/blocked tools updating in real-time

### Test Policy Enforcement
1. Select a tool in the Tool Executor
2. Fill in parameters (if needed)
3. Click "Execute Tool"
4. See policy validation in action

### Interact with Agent
1. Type a message in Agent Chat
2. Use quick actions for common tasks
3. Watch agent respond with reasoning
4. See tool usage and policy blocks

### Simulate Incidents
1. Find a healthy service in Infrastructure Monitor
2. Click "Simulate Failure"
3. Watch service status change to critical
4. Switch to EMERGENCY mode
5. Use tools or agent to resolve the issue

## 🔒 Security Notes

- All API calls go through the backend's policy engine
- Frontend displays policy status but doesn't enforce it
- Security is enforced server-side (defense in depth)

## 🛠️ Troubleshooting

### Backend Not Connected
**Error**: "Failed to connect to policy engine"

**Solution**:
1. Ensure backend is running: `cd proxi-armoriq && python main.py`
2. Check backend is on `http://localhost:8000`
3. Verify no CORS issues in browser console

### Build Errors
**Error**: Module not found

**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Vite cache: `rm -rf node_modules/.vite`

### Styling Not Working
**Error**: Tailwind classes not applying

**Solution**:
1. Ensure PostCSS and Tailwind are installed
2. Check `tailwind.config.js` content paths
3. Restart development server

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Add new components
- Enhance existing features
- Improve styling
- Add tests

## 📝 License

Built for ArmorIQ Hackathon - Educational purposes

---

**Proxi Frontend: Because great security deserves a great UI** 🎨🛡️
