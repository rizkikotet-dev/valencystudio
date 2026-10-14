"use strict";

module.exports = {
  apps: [
    {
      name: "nextjs-production",
      cwd: __dirname,
      script: "../.next/standalone/server.js",
      interpreter: "bun",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0"
      },

      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,

      kill_timeout: 10000,
      listen_timeout: 10000,

      time: true,
      merge_logs: true,

      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};