#!/bin/bash

# My Claude HUD Installation Script
# This script installs my-claude-hud to ~/.claude/plugins/

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLUGIN_DIR="$HOME/.claude/plugins"
PLUGIN_NAME="my-claude-hud"
REPO_URL="https://github.com/Link-Start/my-claude-hud.git"
INSTALL_DIR="$PLUGIN_DIR/$PLUGIN_NAME"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║        My Claude HUD - Installation Script               ║"
echo "║                                                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Create plugins directory if it doesn't exist
if [ ! -d "$PLUGIN_DIR" ]; then
    echo -e "${YELLOW}Creating plugins directory...${NC}"
    mkdir -p "$PLUGIN_DIR"
fi

# Check if plugin already exists
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠ Plugin directory already exists: $INSTALL_DIR${NC}"
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing installation...${NC}"
        rm -rf "$INSTALL_DIR"
    else
        echo -e "${RED}Installation cancelled${NC}"
        exit 0
    fi
fi

# Clone repository
echo -e "${BLUE}Cloning repository...${NC}"
git clone "$REPO_URL" "$INSTALL_DIR"

# Navigate to plugin directory
cd "$INSTALL_DIR"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Build project
echo -e "${BLUE}Building project...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Build failed - dist directory not found${NC}"
    exit 1
fi

# Success message
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Installation Complete!                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Plugin installed to:${NC} $INSTALL_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Add the following to ~/.claude/settings.json:"
echo ""
echo -e "   ${BLUE}{${NC}"
echo -e "   ${BLUE}  \"statusLine\": {${NC}"
echo -e "   ${BLUE}    \"type\": \"command\",${NC}"
echo -e "   ${BLUE}    \"command\": \"node ~/.claude/plugins/my-claude-hud/dist/index.js\"${NC}"
echo -e "   ${BLUE}  }${NC}"
echo -e "   ${BLUE}}${NC}"
echo ""
echo "2. Restart Claude Code"
echo ""
echo -e "${YELLOW}Quick actions:${NC}"
echo "  node ~/.claude/plugins/my-claude-hud/dist/index.js --action=help"
echo ""
echo -e "${GREEN}✓ Installation successful!${NC}"
