#!/bin/bash

# BlueSphere Claude Code Workflow Script
# This script helps you start Claude Code and continue with git activities on macOS

echo "🌊 BlueSphere Claude Code Workflow Script"
echo "=========================================="

# Function to check if Claude Code is installed
check_claude_code() {
    if ! command -v claude &> /dev/null; then
        echo "❌ Claude Code is not installed or not in PATH"
        echo "📦 Please install Claude Code first:"
        echo "   Visit: https://claude.ai/code"
        echo "   Or use: curl -fsSL https://claude.ai/install.sh | sh"
        exit 1
    else
        echo "✅ Claude Code is installed"
    fi
}

# Function to check git status
check_git_status() {
    echo ""
    echo "📋 Current Git Status:"
    git status --short
    
    echo ""
    echo "📈 Recent Commits:"
    git log --oneline -5
}

# Function to show available git operations
show_git_options() {
    echo ""
    echo "🔧 Available Git Operations:"
    echo "1. Push changes to remote repository"
    echo "2. Check detailed git status"
    echo "3. View recent commits"
    echo "4. Create new branch"
    echo "5. Switch branches"
    echo "6. View uncommitted changes"
    echo ""
}

# Function to start Claude Code
start_claude_code() {
    echo ""
    echo "🚀 Starting Claude Code..."
    echo "💡 You can continue working on your BlueSphere project!"
    echo ""
    echo "📁 Current directory: $(pwd)"
    echo "🌐 Project: BlueSphere Ocean Monitoring Platform"
    echo ""
    
    # Start Claude Code
    claude
}

# Main execution
echo "🍎 macOS Terminal Setup for BlueSphere Development"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "⚠️  You don't appear to be in the BlueSphere frontend directory"
    echo "📁 Navigate to your project directory first:"
    echo "   cd /Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site"
    echo ""
    read -p "Do you want to navigate there now? (y/n): " navigate
    if [[ $navigate =~ ^[Yy]$ ]]; then
        cd /Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site
        echo "✅ Navigated to project directory"
    fi
fi

# Check Claude Code installation
check_claude_code

# Show git status
check_git_status

# Show git options
show_git_options

# Ask user what they want to do
echo "What would you like to do?"
echo "c) Start Claude Code"
echo "p) Push changes to GitHub"
echo "s) Show git status"
echo "q) Quit"
echo ""
read -p "Enter your choice: " choice

case $choice in
    c|C)
        start_claude_code
        ;;
    p|P)
        echo "🚀 Pushing changes to GitHub..."
        git push origin main
        echo "✅ Changes pushed!"
        ;;
    s|S)
        echo "📊 Detailed Git Status:"
        git status
        git diff --stat
        ;;
    q|Q)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Starting Claude Code by default..."
        start_claude_code
        ;;
esac