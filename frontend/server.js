// server.js - Express server for serving React app and proxying API requests
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Optional: Azure Key Vault integration if you need to access secrets
// const { DefaultAzureCredential } = require('@azure/identity');
// const { SecretClient } = require('@azure/keyvault-secrets');

const app = express();
const PORT = process.env.PORT || 3000;

// Detailed startup logging
console.log('===== SERVER INITIALIZATION =====');
console.log('Starting server at:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('PORT:', PORT);

// Get Function App URL from environment
const FUNCTION_APP_URL = process.env.FUNCTION_APP_URL;
console.log('FUNCTION_APP_URL:', FUNCTION_APP_URL);

// Configure API proxy to the Azure Function
if (FUNCTION_APP_URL) {
  console.log(`Configuring proxy from /api to ${FUNCTION_APP_URL}`);
  
  // Create and configure the proxy middleware
  const apiProxy = createProxyMiddleware({
    target: FUNCTION_APP_URL,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: function(path) {
      // Keep the path as is - /api/X will be proxied to FUNCTION_APP_URL/api/X
      console.log(`Proxying request from ${path} to ${FUNCTION_APP_URL}${path}`);
      return path;
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send({ error: 'Proxy error', details: err.message });
    }
  });
  
  // Apply the proxy middleware to /api routes
  app.use('/api', apiProxy);
} else {
  console.warn('⚠️ FUNCTION_APP_URL environment variable not set. API proxy will not function.');
  // Provide a mock response for /api routes in development
  app.use('/api', (req, res) => {
    console.warn(`Mock API response for: ${req.method} ${req.path}`);
    res.status(503).json({
      error: 'API proxy not configured',
      message: 'The FUNCTION_APP_URL environment variable is not set. Configure this in Azure App Service settings.'
    });
  });
}

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log(`Checking for dist directory: ${distPath}`);
try {
  if (fs.existsSync(distPath)) {
    console.log('✅ dist directory found');
    console.log('Contents of dist directory:');
    const files = fs.readdirSync(distPath);
    console.log(files);
    
    // Check if index.html exists
    if (files.includes('index.html')) {
      console.log('✅ index.html found in dist directory');
    } else {
      console.warn('⚠️ index.html not found in dist directory');
    }
  } else {
    console.error('❌ dist directory not found. Did you run npm run build?');
  }
} catch (error) {
  console.error('Error checking dist directory:', error);
}

// Serve static files from the 'dist' directory (Vite's default build output)
app.use(express.static(distPath));

// Handle client-side routing - All other requests go to the React app
app.get('*', (req, res) => {
  console.log(`Serving SPA route: ${req.path}`);
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error occurred');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});