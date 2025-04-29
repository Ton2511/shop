// ecosystem.config.js
module.exports = {
    apps: [{
      name: "shop-app",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      watch: false,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-output.log",
      merge_logs: true,
      // Restart app if it crashes
      autorestart: true,
      // Restart app every 24 hours to clear memory leaks
      cron_restart: "0 3 * * *",
      // Wait 3 seconds between restart attempts
      restart_delay: 3000,
      // Disable source map to reduce memory usage
      node_args: "--no-warnings --max-old-space-size=512"
    }]
  };