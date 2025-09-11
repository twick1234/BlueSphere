# 🚀 Quick Start Guide for MacBook Terminal & Claude Code

## How to Start Claude Code and Continue Git Activities

### Step 1: Open Terminal on MacBook
1. Press `Cmd + Space` to open Spotlight
2. Type "Terminal" and press Enter
3. Or use `Cmd + Space` then type "Terminal"

### Step 2: Navigate to Project Directory
```bash
cd /Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site
```

### Step 3: Run the Workflow Script
```bash
./claude-code-workflow.sh
```

This script will:
- ✅ Check if Claude Code is installed
- 📊 Show current git status
- 🔧 Provide git operation options
- 🚀 Launch Claude Code

### Alternative: Direct Claude Code Start
```bash
# Navigate to project
cd /Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site

# Start Claude Code
claude
```

### Common Git Operations
```bash
# Check status
git status

# Push changes
git push origin main

# View recent commits
git log --oneline -5

# View changes
git diff
```

### Development Server
```bash
# Start development server
npm run dev
# Server runs on http://localhost:4000
```

### Quick Reference
- **Project Path**: `/Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site`
- **Development URL**: `http://localhost:4000`
- **Main Branch**: `main`
- **Documentation**: Check `docs/` folder for detailed guides

### Troubleshooting
- If Claude Code is not found, install it from: https://claude.ai/code
- If git commands fail, ensure you're in the project directory
- If npm commands fail, run `npm install` first