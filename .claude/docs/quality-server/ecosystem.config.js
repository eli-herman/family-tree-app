/**
 * PM2 Ecosystem Configuration for Quality Server
 *
 * This file manages both ChromaDB and the Quality Server as persistent services.
 *
 * Usage:
 *   pm2 start ecosystem.config.js      # Start all services
 *   pm2 start ecosystem.config.js --only chromadb
 *   pm2 start ecosystem.config.js --only quality-server
 *   pm2 stop all                       # Stop all services
 *   pm2 restart all                    # Restart all services
 *   pm2 logs                           # View all logs
 *   pm2 save                           # Save current process list
 *
 * Note: Paths are configured for the standard Windows installation.
 * Adjust paths if your Python or data directories differ.
 */

module.exports = {
  apps: [
    {
      name: 'chromadb',
      script: 'C:\\Users\\elijh\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\chroma.exe',
      args: 'run --path D:\\chromadb-data --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        ANONYMIZED_TELEMETRY: 'false'
      }
    },
    {
      name: 'quality-server',
      script: 'node_modules/ts-node/dist/bin.js',
      args: 'server.ts',
      cwd: 'C:\\quality-server',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        CHROMA_URL: 'http://localhost:8000',
        OLLAMA_URL: 'http://localhost:11434'
      }
    }
  ]
};
