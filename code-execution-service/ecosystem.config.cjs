module.exports = {
  apps: [
    {
      name: 'code-execution',
      script: './build/server.js',
      cwd: '/var/www/code-execution',
      instances: 1,  // Single instance for Docker execution
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      // Logging
      error_file: '/var/log/pm2/code-exec-error.log',
      out_file: '/var/log/pm2/code-exec-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ]
};
