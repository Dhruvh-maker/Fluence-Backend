import { createServer } from 'http';
import app from './app.js';
import { getConfig } from './config/index.js';
import { BackgroundJobsService } from './services/background-jobs.service.js';

const { port } = getConfig();

const server = createServer(app);

server.listen(port, () => {
  console.log(`Auth service listening on port ${port}`);
  
  // Initialize background jobs
  BackgroundJobsService.initialize();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  BackgroundJobsService.stopAllJobs();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  BackgroundJobsService.stopAllJobs();
  server.close(() => {
    console.log('Process terminated');
  });
});


