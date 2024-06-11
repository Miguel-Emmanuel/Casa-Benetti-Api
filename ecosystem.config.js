module.exports = {
  apps: [
    {
      name: 'CASA-BENETTI-API',
      instances: 1,
      interpreter: './node_modules/ts-node/dist/bin.js',
      script: 'dist/index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_stage: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
