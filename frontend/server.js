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
const FUNCTION_APP_URL = process.env.FUNCTION_APP_URL; // Set by Azure App Service, e.g., https://logocraftfunc-app.azurewebsites.net

// Middleware to proxy API requests to the Azure Function
if (FUNCTION_APP_URL) {
  app.use('/api', createProxyMiddleware({
    target: FUNCTION_APP_URL, // This will proxy /api/FunctionName to https://logocraftfunc-app.azurewebsites.net/api/FunctionName
    changeOrigin: true,
    // pathRewrite is not needed if the target functions are at /api/FunctionName relative to FUNCTION_APP_URL base
    // and the frontend calls /api/FunctionName.
    // If FUNCTION_APP_URL was 'https://logocraftfunc-app.azurewebsites.net/api', then pathRewrite: {'^/api': ''} would be correct.
    // If FUNCTION_APP_URL is 'https://logocraftfunc-app.azurewebsites.net', no pathRewrite is needed for /api -> /api.
    logLevel: 'debug'
  }));
} else {
  console.warn('FUNCTION_APP_URL environment variable not set. API proxy will not function.');
}

// Serve static files from the 'dist' directory (Vite's default build output)
app.use(express.static(path.join(__dirname, 'dist'))); // eslint-disable-line no-undef

// All other requests go to the React app (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')); // eslint-disable-line no-undef
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
