#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'generated');

console.log('🚀 Generating SDK from OpenAPI spec...');

try {
  // Remove existing generated files
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate TypeScript client
  execSync(
    `npx @openapitools/openapi-generator-cli generate ` +
    `-i ${API_URL}/api-json ` +
    `-g typescript-axios ` +
    `-o ${OUTPUT_DIR} ` +
    `--additional-properties=withSeparateModelsAndApi=true,apiPackage=api,modelPackage=models`,
    { stdio: 'inherit' }
  );

  console.log('✅ SDK generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate SDK:', error.message);
  process.exit(1);
}