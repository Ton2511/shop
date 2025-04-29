// src/middleware/errorHandler.js
const fs = require('fs');
const path = require('path');

// Create a logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Function to log errors to a file
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, 'error.log');
  
  const logEntry = `
${timestamp}
URL: ${req.method} ${req.url}
${err.stack || err.message || err}
User: ${req.session && req.session.user ? req.session.user.email : 'Not logged in'}
Headers: ${JSON.stringify(req.headers)}
Body: ${JSON.stringify(req.body)}
------------------------
`;

  fs.appendFileSync(logFile, logEntry);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Application Error:', err);
  logError(err, req);

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Check the environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  // For API requests
  if (req.xhr || req.path.includes('/api/')) {
    return res.status(500).json({
      error: isProduction ? 'Internal Server Error' : err.message,
      stack: isProduction ? null : err.stack
    });
  }

  // For regular requests, render an error page
  res.status(500);
  
  // Determine if we should show technical details
  const showDetails = !isProduction;
  
  // Try to render an error page, or default to a basic HTML error message
  try {
    res.render('error', {
      title: 'Server Error',
      message: 'We\'re sorry, but something went wrong on our end.',
      error: showDetails ? err : {},
      showDetails: showDetails
    });
  } catch (renderError) {
    // If rendering fails, send a basic HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 50px; line-height: 1.6; }
          .error-container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          h1 { color: #e74c3c; }
          .error-details { background: #f8f9fa; padding: 15px; border-radius: 3px; margin-top: 20px; }
          .btn { display: inline-block; padding: 8px 16px; background: #3498db; color: white; text-decoration: none; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Server Error</h1>
          <p>We're sorry, but something went wrong on our end.</p>
          <p>Our team has been notified and is working on fixing the issue.</p>
          <a href="/" class="btn">Return to Home Page</a>
          ${showDetails ? `
            <div class="error-details">
              <h3>Error Details:</h3>
              <p>${err.message || 'Unknown error'}</p>
              <pre>${err.stack || ''}</pre>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `);
  }
};

// Not Found (404) handler
const notFoundHandler = (req, res, next) => {
  // For API requests
  if (req.xhr || req.path.includes('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `The requested URL ${req.url} was not found`
    });
  }

  // For regular requests
  res.status(404);
  
  // Try to render a 404 page, or default to a basic HTML error message
  try {
    res.render('404', {
      title: 'Page Not Found',
      url: req.url
    });
  } catch (renderError) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 50px; line-height: 1.6; }
          .error-container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          h1 { color: #3498db; }
          .btn { display: inline-block; padding: 8px 16px; background: #3498db; color: white; text-decoration: none; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <p>The URL <code>${req.url}</code> is not recognized by our server.</p>
          <a href="/" class="btn">Return to Home Page</a>
        </div>
      </body>
      </html>
    `);
  }
};

module.exports = {
  errorHandler,
  notFoundHandler
};