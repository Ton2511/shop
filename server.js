// server.js for Passenger
const app = require('./app');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log function for debugging
const logStartup = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'server-startup.log'), logEntry);
};

// Log startup information
logStartup('Server starting');
logStartup(`Node version: ${process.version}`);
logStartup(`Environment: ${process.env.NODE_ENV}`);
logStartup(`Working directory: ${process.cwd()}`);
logStartup(`Application directory: ${__dirname}`);

// If not running under Passenger, start the server on a port
if (!process.env.PASSENGER_BASE_URI) {
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    logStartup(`Server running on port ${PORT}`);
  });
} else {
  // Running under Passenger
  logStartup('Running under Passenger');
}

process.on('uncaughtException', (err) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Uncaught Exception: ${err.message}\n${err.stack}\n\n`;
  
  // Log to console
  console.error('Uncaught Exception:', err);
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
  
  // Don't exit the process - let Passenger handle it
});

process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Unhandled Rejection: ${reason}\n\n`;
  
  // Log to console
  console.error('Unhandled Rejection:', reason);
  
  // Log to file
  fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
  
  // Don't exit the process - let Passenger handle it
});