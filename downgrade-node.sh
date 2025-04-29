#!/bin/bash
# Save this as downgrade-node.sh in your Plesk server

# Check if running as root
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Print current Node.js version
echo "Current Node.js version:"
node -v

# Install Node.js version manager (n)
echo "Installing Node.js version manager (n)..."
npm install -g n

# Install and use Node.js 16 (LTS) - compatible with most libraries
echo "Installing Node.js 16..."
n 16.20.2

# Update npm
echo "Updating npm..."
npm install -g npm

# Print new Node.js version
echo "New Node.js version:"
node -v
echo "New npm version:"
npm -v

echo "Node.js downgrade complete."
echo "Remember to restart Passenger and your application."
echo "You can do this by running: plesk bin domain --update-node-app rpcintertrade.com"