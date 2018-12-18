module.exports = {
  apps : [{
    name: 'CMIP-backend',
    script: 'dist/server.js',
    args: '--nolazy --inspect=0.0.0.0:65535',
    instances: 4,
    autorestart: true,
    watch: true,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    output: 'dist/logs/log.log',
    error: 'dist/logs/error.err',
    log_date_format: 'YYYY-MM-DD HH:mm',
    merge_logs: true,

  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
