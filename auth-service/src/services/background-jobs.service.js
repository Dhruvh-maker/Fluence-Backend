import cron from 'node-cron';

export class BackgroundJobsService {
  static jobs = new Map();

  /**
   * Initialize all background jobs
   */
  static initialize() {
    console.log('Initializing background jobs...');

    // Clean up expired sessions daily at 2 AM
    this.scheduleJob('sessionCleanup', '0 2 * * *', async () => {
      try {
        console.log('Cleaning up expired sessions...');
        const { getPool } = await import('../db/pool.js');
        const pool = getPool();
        const result = await pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
        console.log(`Cleaned up ${result.rowCount} expired sessions`);
      } catch (error) {
        console.error('Error cleaning up sessions:', error);
      }
    });

    // Clean up expired tokens daily at 3 AM
    this.scheduleJob('tokenCleanup', '0 3 * * *', async () => {
      try {
        console.log('Cleaning up expired tokens...');
        const { getPool } = await import('../db/pool.js');
        const pool = getPool();
        const result = await pool.query(`
          DELETE FROM password_reset_tokens WHERE expires_at < NOW();
          DELETE FROM email_verification_tokens WHERE expires_at < NOW();
        `);
        console.log(`Cleaned up expired tokens`);
      } catch (error) {
        console.error('Error cleaning up tokens:', error);
      }
    });

    // Clean up old login attempts weekly on Sunday at 4 AM
    this.scheduleJob('loginAttemptsCleanup', '0 4 * * 0', async () => {
      try {
        console.log('Cleaning up old login attempts...');
        const { getPool } = await import('../db/pool.js');
        const pool = getPool();
        const result = await pool.query('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL \'30 days\'');
        console.log(`Cleaned up ${result.rowCount} old login attempts`);
      } catch (error) {
        console.error('Error cleaning up login attempts:', error);
      }
    });

    console.log('Background jobs initialized successfully');
  }

  /**
   * Schedule a cron job
   */
  static scheduleJob(name, cronExpression, task) {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already exists, stopping it first`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC'
    });

    this.jobs.set(name, job);
    job.start();
    console.log(`Scheduled job: ${name} with expression: ${cronExpression}`);
  }

  /**
   * Stop a specific job
   */
  static stopJob(name) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).stop();
      console.log(`Stopped job: ${name}`);
    } else {
      console.log(`Job ${name} not found`);
    }
  }

  /**
   * Stop all jobs
   */
  static stopAllJobs() {
    console.log('Stopping all background jobs...');
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * Get job status
   */
  static getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    return status;
  }

  /**
   * Manually trigger a job (for testing)
   */
  static async triggerJob(name) {
    switch (name) {
      case 'sessionCleanup':
        const { getPool } = await import('../db/pool.js');
        const pool = getPool();
        const result = await pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
        return { cleaned: result.rowCount };
      case 'tokenCleanup':
        const { getPool: getPool2 } = await import('../db/pool.js');
        const pool2 = getPool2();
        await pool2.query(`
          DELETE FROM password_reset_tokens WHERE expires_at < NOW();
          DELETE FROM email_verification_tokens WHERE expires_at < NOW();
        `);
        return { cleaned: 'expired tokens' };
      case 'loginAttemptsCleanup':
        const { getPool: getPool3 } = await import('../db/pool.js');
        const pool3 = getPool3();
        const result3 = await pool3.query('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL \'30 days\'');
        return { cleaned: result3.rowCount };
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }
}