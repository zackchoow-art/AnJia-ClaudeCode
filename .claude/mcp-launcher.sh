#!/bin/bash

# MCP Launcher script to ensure correct Node.js version is used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the LTS version of Node
nvm use --lts > /dev/null 2>&1

# Pass all arguments to npx
exec $HOME/.nvm/versions/node/v24.16.0/bin/npx -y chrome-devtools-mcp@latest "$@"
