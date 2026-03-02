const path = require("path");

module.exports = {
  apps: [
    {
      name: "Eppy-Website",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",

      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: path.join(__dirname, "logs/PM2error/error.log"),
      out_file: path.join(__dirname, "logs/PM2output/output.log"),
      merge_logs: true,

      watch: ["src"],
      autorestart: false,
      listen_timeout: 5000,
      restart_delay: 5000,

      max_memory_restart: "700M",
      node_args: [
        "--max-old-space-size=512",
        "--optimize_for_size",
        "--gc_interval=100",
      ].join(" "),

      cron_restart: "0 5 */2 * *",

      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
