/* eslint-env node */
// server.js - Express server for serving React app and proxying API requests
const express = require('express'); // eslint-disable-line no-undef
const { createProxyMiddleware } = require('http-proxy-middleware'); // eslint-disable-line no-undef
const path = require('path'); // eslint-disable-line no-undef
const { DefaultAzureCredential } = require('@azure/identity'); // eslint-disable-line no-undef
const { SecretClient } = require('@azure/keyvault-secrets'); // eslint-disable-line no-undef

const app = express();
const PORT = process.env.PORT || 3000; // eslint-disable-line no-undef

// Get Function App URL from environment
const FUNCTION_APP_URL = process.env.FUNCTION_APP_URL || 'https://logocraftfunctions.azurewebsites.net'; // eslint-disable-line no-undef

// Middleware to proxy API requests to the Azure Function
app.use('/api', createProxyMiddleware({
  target: FUNCTION_APP_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove /api prefix, so /api/GetSasToken -> /GetSasToken
  },
  logLevel: 'debug'
}));

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build'))); // eslint-disable-line no-undef

// All other requests go to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html')); // eslint-disable-line no-undef
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
