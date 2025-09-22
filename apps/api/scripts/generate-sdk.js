#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const API_PORT = process.env.API_PORT || 3001;
const SDK_PATH = path.join(__dirname, '..', '..', '..', 'packages', 'sdk');

console.log('🚀 Starting API server for SDK generation...');

// Start API server in background
const server = require('child_process').spawn('node', ['dist/main'], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, PORT: API_PORT },
  detached: true,
  stdio: 'ignore'
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log('📡 Generating SDK...');
    
    // Generate SDK
    execSync('pnpm run generate', {
      cwd: SDK_PATH,
      env: { ...process.env, API_URL: `http://localhost:${API_PORT}` },
      stdio: 'inherit'
    });
    
    console.log('✅ SDK generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate SDK:', error);
  } finally {
    // Kill the server
    process.kill(-server.pid);
  }
}, 5000);